# Change Log

All notable changes to the "vscode-rmt" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-09-08

### Added

- Multi-cursor support: every selection is processed in a single edit (one undo step).

### Changed

- The command is no longer shown in the Command Palette when nothing is selected.
- `@types/vscode` is pinned to 1.85.0, matching the minimum supported VS Code version.
- Development toolchain: pnpm, Node 24, ESLint flat config with type-aware rules, Jest 30, TypeScript 5.9.
- The VSIX no longer includes development files (lockfile, configs, devcontainer).

### Fixed

- A `<` that does not start a tag (`a < b`, an unterminated `<foo`) is left untouched instead of deleting text up to the next `>` or the end of the selection.
- Comments and quoted attribute values containing `>` are removed cleanly instead of leaving fragments behind.
- XML element names with non-ASCII characters are recognized.

## [1.0.1]

- Initial release.
