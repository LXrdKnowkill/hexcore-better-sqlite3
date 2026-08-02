# Changelog

All notable changes to `hexcore-better-sqlite3` will be documented in this file.

## [2.0.2] - 2026-08-02

### Added

- `Statement#pluck()` support for returning the first result column directly.
- Native coverage for enabling, disabling, and composing `pluck()`, `raw()`, and `expand()` modes.

### Fixed

- Synchronized the standalone wrapper with the HexCore production source.
- Hardened native-addon discovery across local Release/Debug builds and N-API prebuild naming conventions.
- Improved the diagnostic emitted when the JavaScript database layer is loaded without the root addon loader.

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
