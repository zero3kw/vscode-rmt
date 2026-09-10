# Change Log

All notable changes to the "vscode-rmt" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-09-10

### Added

- Multi-cursor support: every selection is processed in a single edit (one undo step).
- Plain-text conversion: `<script>`/`<style>` elements are removed with their contents and character references (`&amp;`, `&lt;`, `&nbsp;`, `&#8212;`, …) are decoded, and `<br>` becomes a line break. Each can be turned off with `removeMarkupTags.removeScriptAndStyleContent` / `removeMarkupTags.decodeEntities` / `removeMarkupTags.replaceLineBreaks` (language-overridable).

### Changed

- The command is no longer shown in the Command Palette when nothing is selected.
- After tags are removed, the selection is cleared. Previously the replaced text remained selected.
- The extension package is much smaller.

### Fixed

- A `<` that does not start a tag (`a < b`, an unterminated `<foo`) is no longer changed. Previously the text up to the next `>` or the end of the selection was deleted.
- Comments and quoted attribute values that contain `>` are removed completely. Previously part of them remained in the text.
- XML element names with non-ASCII characters are recognized.
- CDATA sections keep their contents. Previously the whole section was removed.

## [1.0.1]

- Initial release.
