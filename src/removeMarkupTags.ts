/**
 * Strips HTML/XML markup tags from the given text.
 *
 * A tag starts with `<` or `</` followed by a name-start character (a letter,
 * `_` or `:`; `!` and `?` for doctype/CDATA/processing instructions) and runs
 * to the next `>` outside of quoted attribute values. Comments are removed as
 * a whole, so a `>` inside them is fine. A `<` that does not start a tag
 * (`a < b`, an unterminated `<foo`) is left untouched.
 */
export function removeMarkupTags(text: string): string {
    return text.replace(/<!--[\s\S]*?-->|<\/?[\p{L}_:!?](?:"[^"]*"|'[^']*'|[^'">])*>/gu, '');
}
