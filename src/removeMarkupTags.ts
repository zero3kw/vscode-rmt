export interface RemoveMarkupTagsOptions {
    /** Drop `<script>` and `<style>` elements together with their contents. Default: true. */
    removeScriptAndStyleContent?: boolean;
    /** Decode `&lt;` `&gt;` `&amp;` `&quot;` `&apos;` `&nbsp;` and numeric character references. Default: true. */
    decodeEntities?: boolean;
    /** Replacement for `<br>` tags; `null` removes them like any other tag. Default: `'\n'`. */
    lineBreak?: string | null;
}

// Attribute values may contain `>`, so quoted strings are skipped as a whole. Outside quotes a
// `<` cannot appear inside a tag; stopping there keeps the scan for a missing `>` from running
// to the end of the text for every `<`.
const ATTRIBUTES = String.raw`(?:"[^"]*"|'[^']*'|[^'"<>])*`;
const NAME_END = String.raw`(?![\p{L}\p{N}_.:-])`;
const RAW_TEXT_ELEMENT = String.raw`<(?<element>script|style)${NAME_END}${ATTRIBUTES}>[\s\S]*?</\k<element>\s*>`;
const CDATA_SECTION = String.raw`<!\[CDATA\[(?<cdata>[\s\S]*?)\]\]>`;
const COMMENT = String.raw`<!--[\s\S]*?-->`;
const LINE_BREAK = String.raw`<(?<br>br)${NAME_END}${ATTRIBUTES}>`;
// A tag starts with `<` or `</` and a name-start character (letter, `_`, `:`; `!` and `?` cover
// doctype and processing instructions), so `a < b` and an unterminated `<foo` are not tags.
const TAG = String.raw`</?[\p{L}_:!?]${ATTRIBUTES}>`;
const CHARACTER_REFERENCE = String.raw`&(?<reference>#[xX][0-9a-fA-F]{1,6}|#[0-9]{1,7}|[a-zA-Z]+);`;

// Everything is matched in a single pass so that text that is output unchanged (CDATA contents,
// decoded references) is not scanned for tags again.
const TOKENS = new RegExp(
    [RAW_TEXT_ELEMENT, CDATA_SECTION, COMMENT, LINE_BREAK, TAG, CHARACTER_REFERENCE].join('|'), 'giu');
const TOKENS_KEEPING_RAW_TEXT = new RegExp(
    [CDATA_SECTION, COMMENT, LINE_BREAK, TAG, CHARACTER_REFERENCE].join('|'), 'giu');

const NAMED_REFERENCES = new Map([
    ['lt', '<'], ['gt', '>'], ['amp', '&'], ['quot', '"'], ['apos', '\''], ['nbsp', '\u00A0'],
    ['LT', '<'], ['GT', '>'], ['AMP', '&'], ['QUOT', '"'],
]);

/**
 * Strips HTML/XML markup from the given text, leaving its text content.
 *
 * Tags, comments, doctype and processing instructions are removed; CDATA sections are
 * replaced by their contents. By default `<script>`/`<style>` elements are dropped with
 * their contents, character references are decoded and `<br>` becomes a line break; see
 * {@link RemoveMarkupTagsOptions}. A `<` that does not start a tag (`a < b`, an
 * unterminated `<foo`) is left untouched.
 */
export function removeMarkupTags(text: string, options: RemoveMarkupTagsOptions = {}): string {
    const { removeScriptAndStyleContent = true, decodeEntities = true, lineBreak = '\n' } = options;
    const tokens = removeScriptAndStyleContent ? TOKENS : TOKENS_KEEPING_RAW_TEXT;

    let result = '';
    let position = 0;
    for (const match of text.matchAll(tokens)) {
        result += text.slice(position, match.index) + replacement(match, decodeEntities, lineBreak);
        position = match.index + match[0].length;
    }
    return result + text.slice(position);
}

function replacement(match: RegExpExecArray, decodeEntities: boolean, lineBreak: string | null): string {
    const cdata = match.groups?.cdata;
    if (cdata !== undefined) {
        return cdata;
    }
    if (match.groups?.br !== undefined) {
        return lineBreak ?? '';
    }
    const reference = match.groups?.reference;
    if (reference !== undefined) {
        return decodeEntities ? decodeReference(reference) ?? match[0] : match[0];
    }
    return '';
}

/** Returns the referenced character, or undefined to leave the reference as written. */
function decodeReference(reference: string): string | undefined {
    if (!reference.startsWith('#')) {
        return NAMED_REFERENCES.get(reference);
    }
    const codePoint = /^#[xX]/.test(reference)
        ? parseInt(reference.slice(2), 16)
        : parseInt(reference.slice(1), 10);
    const isSurrogate = codePoint >= 0xd800 && codePoint <= 0xdfff;
    if (codePoint === 0 || codePoint > 0x10ffff || isSurrogate) {
        return undefined;
    }
    return String.fromCodePoint(codePoint);
}
