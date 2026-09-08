import * as fs from 'fs';
import * as path from 'path';
import { removeMarkupTags } from '../removeMarkupTags';

describe('removeMarkupTags', () => {
    test.each([
        ['HTML tags', '<p>This is <b>bold</b> text.</p>', 'This is bold text.'],
        ['multiple tags', '<div><p>Paragraph</p> and <span>span</span></div>', 'Paragraph and span'],
        ['nested tags', '<div><p>This <span>is <i>nested</i></span></p></div>', 'This is nested'],
        ['tags with attributes', '<p class="text">Text with <a href="#">link</a></p>', 'Text with link'],
        ['self-closing tags', 'Line<br/>Break<img src="image.jpg"/>', 'LineBreak'],
        ['empty tags', 'Text with <b></b>empty tag', 'Text with empty tag'],
        ['text without any tags', 'Just plain text', 'Just plain text'],
        ['empty string', '', ''],
        ['comments containing >', '<!-- a > b -->keep', 'keep'],
        ['double-quoted attributes containing >', '<a title="x > y">link</a>', 'link'],
        ['single-quoted attributes containing >', '<a title=\'x > y\'>link</a>', 'link'],
        ['doctype and processing instructions', '<!DOCTYPE html><?xml version="1.0"?><p>x</p>', 'x'],
        ['tags spanning lines', '<div\n  class="multi"\n>multi-line tag</div>', 'multi-line tag'],
        ['non-ASCII XML element names', '<見出し>テキスト</見出し>', 'テキスト'],
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

    test('strips every tag from the sample fixture', () => {
        const fixture = fs.readFileSync(path.join(__dirname, 'test.txt'), 'utf8');
        const result = removeMarkupTags(fixture);
        expect(result).not.toMatch(/[<>]/);
        expect(result).toContain('これは段落です。');
        expect(result).toContain('これは太字のテキストです。');
    });
});
