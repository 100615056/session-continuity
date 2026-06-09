# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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
