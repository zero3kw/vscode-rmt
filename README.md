# Remove Markup Tags

Strip HTML/XML markup from the selected text in Visual Studio Code, leaving just the text.

![Remove Markup Tags in action](images/demo.gif)

## Features

- Removes tags, comments, doctype and processing instructions from every selection — multi-cursor selections included — as a single undoable edit.
- Turns HTML into plain text by default: `<script>` and `<style>` elements are dropped together with their contents, character references such as `&amp;`, `&lt;`, `&nbsp;` and `&#8212;` are decoded, and `<br>` becomes a line break. Each of these can be switched off (see [Settings](#settings)).
- Leaves non-markup alone: comparison operators (`a < b`), an unterminated `<`, and `>` inside comments or quoted attribute values do not confuse it. CDATA sections keep their contents.
- Works with XML as well as HTML, including non-ASCII element names.

## Usage

1. Select the text that contains markup. Multiple cursors are fine.
2. Open the Command Palette (`Ctrl+Shift+P`, or `Cmd+Shift+P` on macOS) and run **Remove Markup Tags**. The command is listed only while something is selected.
3. Each selection is replaced by its text content and collapsed to the cursor. Use Undo to get the original back.

To bind a key, add a shortcut for `extension.removeMarkupTags` in Keyboard Shortcuts (`Ctrl+K Ctrl+S`).

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `removeMarkupTags.removeScriptAndStyleContent` | `true` | Drop `<script>` and `<style>` elements together with their contents, not just their tags. |
| `removeMarkupTags.decodeEntities` | `true` | Decode `&lt;` `&gt;` `&amp;` `&quot;` `&apos;` `&nbsp;` and numeric character references after removing tags. |
| `removeMarkupTags.replaceLineBreaks` | `true` | Replace `<br>` with a line break (matching the document's end-of-line sequence) instead of removing it. |

All of them can be overridden per language — for example, to keep character references intact while editing HTML source:

```json
"[html]": {
  "removeMarkupTags.decodeEntities": false
}
```

## Limitations

The extension works on the text itself rather than parsing it as a document:

- Only the named character references listed above are decoded; others such as `&copy;` are left as written. Numeric references always work.
- A `<script>` or `<style>` element without a closing tag loses only its opening tag; its contents stay.
- Anything that looks like a tag is removed, including `<T>` in generic code.

## Installation

Search for **Remove Markup Tags** in the Extensions view (`Ctrl+Shift+X`), or open Quick Open (`Ctrl+P`) and run `ext install zero3.vscode-rmt`.

## Development

```bash
pnpm install
pnpm test   # compile, lint, and run the Jest suite
```

Press `F5` to launch an Extension Development Host with a sample file open.

## License

[MIT](LICENSE.md)
