import * as fs from 'fs';
import * as path from 'path';
import { removeMarkupTags } from '../removeMarkupTags';

describe('removeMarkupTags', () => {
    test.each([
        ['HTML tags', '<p>This is <b>bold</b> text.</p>', 'This is bold text.'],
        ['multiple tags', '<div><p>Paragraph</p> and <span>span</span></div>', 'Paragraph and span'],
        ['nested tags', '<div><p>This <span>is <i>nested</i></span></p></div>', 'This is nested'],
        ['tags with attributes', '<p class="text">Text with <a href="#">link</a></p>', 'Text with link'],
        ['self-closing tags', 'Line<hr/>Break<img src="image.jpg"/>', 'LineBreak'],
        ['empty tags', 'Text with <b></b>empty tag', 'Text with empty tag'],
        ['text without any tags', 'Just plain text', 'Just plain text'],
        ['empty string', '', ''],
        ['comments containing >', '<!-- a > b -->keep', 'keep'],
        ['double-quoted attributes containing >', '<a title="x > y">link</a>', 'link'],
        ['single-quoted attributes containing >', '<a title=\'x > y\'>link</a>', 'link'],
        ['doctype and processing instructions', '<!DOCTYPE html><?xml version="1.0"?><p>x</p>', 'x'],
        ['tags spanning lines', '<div\n  class="multi"\n>multi-line tag</div>', 'multi-line tag'],
        ['non-ASCII XML element names', '<見出し>テキスト</見出し>', 'テキスト'],
        ['script elements with their contents', 'a<script type="text/javascript">if (a < b) {}</script>b', 'ab'],
        ['style elements with their contents', 'a<style>p > a { color: red }</style>b', 'ab'],
        ['script elements regardless of case', 'a<SCRIPT>x</script>b', 'ab'],
        ['CDATA wrappers while keeping their contents', 'a<![CDATA[ 1 < 2 ]]>b', 'a 1 < 2 b'],
    ])('removes %s', (_name, input, expected) => {
        expect(removeMarkupTags(input)).toBe(expected);
    });

    test.each([
        ['comparison operators', 'a < b and c > d'],
        ['a digit after <', '1 <2 and 3> 4'],
        ['an unterminated tag', 'if (x <y) {\n  return 1;\n}'],
    ])('leaves %s untouched', (_name, input) => {
        expect(removeMarkupTags(input)).toBe(input);
    });

    describe('character references', () => {
        test.each([
            ['the XML named references', 'Tom &amp; Jerry &quot;x&quot; &apos;y&apos; &lt;&gt;', 'Tom & Jerry "x" \'y\' <>'],
            ['legacy upper-case names', '&LT;&GT;&AMP;&QUOT;', '<>&"'],
            ['&nbsp;', 'a&nbsp;b', 'a\u00A0b'],
            ['decimal and hexadecimal references', '&#8212; &#x2014; &#X2014;', '— — —'],
            ['astral code points', '&#x1F600;', '😀'],
        ])('decodes %s', (_name, input, expected) => {
            expect(removeMarkupTags(input)).toBe(expected);
        });

        test('does not treat decoded text as markup', () => {
            expect(removeMarkupTags('&lt;p&gt;escaped&lt;/p&gt;')).toBe('<p>escaped</p>');
            expect(removeMarkupTags('&amp;lt;')).toBe('&lt;');
        });

        test.each([
            ['unknown named references', '&copy; &foo;'],
            ['bare ampersands', 'a & b &amp c'],
            ['references to invalid code points', '&#0; &#xD800; &#1114112;'],
            ['references inside CDATA', '<![CDATA[&lt;]]>'],
        ])('keeps %s as written', (_name, input) => {
            expect(removeMarkupTags(input)).toBe(input.replace(/<!\[CDATA\[|\]\]>/g, ''));
        });
    });

    describe('line breaks', () => {
        test.each([
            ['<br>', 'a<br>b'],
            ['<br/>', 'a<br/>b'],
            ['<br />', 'a<br />b'],
            ['<BR>', 'a<BR>b'],
            ['<br> with attributes', 'a<br class="x">b'],
        ])('replaces %s with a line break', (_name, input) => {
            expect(removeMarkupTags(input)).toBe('a\nb');
        });

        test('uses the given line break', () => {
            expect(removeMarkupTags('a<br>b', { lineBreak: '\r\n' })).toBe('a\r\nb');
        });

        test('lineBreak: null removes <br> like any other tag', () => {
            expect(removeMarkupTags('a<br>b', { lineBreak: null })).toBe('ab');
        });

        test('does not mistake elements whose name merely starts with br', () => {
            expect(removeMarkupTags('a<br-x>b</br-x>')).toBe('ab');
        });
    });

    describe('options', () => {
        test('removeScriptAndStyleContent: false keeps the contents and removes only the tags', () => {
            const input = '<script>if (a < b) {}</script><style>p > a {}</style>';
            expect(removeMarkupTags(input, { removeScriptAndStyleContent: false })).toBe('if (a < b) {}p > a {}');
        });

        test('decodeEntities: false leaves character references as written', () => {
            expect(removeMarkupTags('<b>&lt;&#8212;</b>', { decodeEntities: false })).toBe('&lt;&#8212;');
        });
    });

    test('strips every tag from the sample fixture', () => {
        const fixture = fs.readFileSync(path.join(__dirname, 'test.txt'), 'utf8');
        const result = removeMarkupTags(fixture);
        expect(result).not.toMatch(/[<>]/);
        expect(result).toContain('これは段落です。');
        expect(result).toContain('これは太字のテキストです。');
    });
});
