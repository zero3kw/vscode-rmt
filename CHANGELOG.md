# Change Log

All notable changes to the "vscode-rmt" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0]

### Added

- Multi-cursor support: every selection is processed in a single edit (one undo step).
- Plain-text conversion: `<script>`/`<style>` elements are removed with their contents and character references (`&amp;`, `&lt;`, `&nbsp;`, `&#8212;`, …) are decoded, and `<br>` becomes a line break. Each can be turned off with `removeMarkupTags.removeScriptAndStyleContent` / `removeMarkupTags.decodeEntities` / `removeMarkupTags.replaceLineBreaks` (language-overridable).

### Changed

- The command is no longer shown in the Command Palette when nothing is selected.
- After tags are removed, each selection collapses to its cursor instead of staying highlighted.
- The extension package is much smaller.

### Fixed

- A `<` that does not start a tag (`a < b`, an unterminated `<foo`) is left untouched instead of deleting text up to the next `>` or the end of the selection.
- Comments and quoted attribute values containing `>` are removed cleanly instead of leaving fragments behind.
- XML element names with non-ASCII characters are recognized.
- CDATA sections keep their contents instead of being removed whole.

## [1.0.1]

- Initial release.
