# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.3.0] - 2026-06-21

### Added
- **`edit_session`** — merge updates into the most recent session entry without replacing it. Only provided fields are changed.
- **`undo_session`** — remove the most recent session entry. Pinned decisions are not affected.
- **`migrate_project`** — move session history when a project directory is renamed. Fixes orphaned sessions caused by path-based hashing.
- **`doctor`** — diagnostic tool that checks sessions directory, data integrity, orphaned sessions, and last activity age.
- Orphan detection on `load_session` — warns when sessions exist under old path hashes.

### Changed
- **Full TypeScript migration** — entire codebase converted from JavaScript to TypeScript with strict types.
- Cross-editor setup docs added (Cursor, VS Code, Windsurf).
- Pinned decision separator improved for readability.
- Security warning added for plaintext session data.

## [0.1.7] - 2026-06-08

### Added
- `PreCompact` hook support: `sc init` now registers a `PreCompact` hook alongside the existing `Stop` hook, so a snapshot is saved before Claude Code compresses the context window mid-session.

## [0.1.6] - 2026-05-25

### Added
- Feedback & Discussion link in README.

## [0.1.5] - 2026-05-25

### Fixed
- License corrected from MIT to PolyForm Noncommercial 1.0.0.
- `bin` entry formatting fixed via `npm pkg fix`.

## [0.1.4] - 2026-05-25

### Changed
- README rewritten with MCP-first framing.

## [0.1.3] - 2026-05-25

### Added
- MCP server (`sc-mcp`) for richer cross-project session continuity.
- Switched to PolyForm Noncommercial 1.0.0 license.
