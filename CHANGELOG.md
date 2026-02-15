# Changelog

All notable changes to `hexcore-better-sqlite3` will be documented in this file.

## [2.0.0] - 2026-02-14

### Added

- Published to npm.
- `.vscodeignore` with `!prebuilds/**` force-include for packaged builds.

### Changed

- Prebuild loader hardened with multi-convention naming support.

## [1.0.0] - 2026-02-10

### Added

- Initial release.
- N-API wrapper for SQLite based on better-sqlite3@11.9.1.
- Pre-compiled static SQLite library (avoids recompiling 245k lines of C).
- Windows x64 prebuilt binary (N-API v8).
- Used by hexcore-ioc for IOC match deduplication backend.
