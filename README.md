# HexCore Better-SQLite3

N-API wrapper for SQLite, based on the [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) binding layer. Part of **HikariSystem HexCore**.

## Architecture

This package follows the standard HexCore native wrapper pattern:

- `src/better_sqlite3.cpp` — N-API binding (the wrapper layer)
- `deps/sqlite3/include/` — SQLite headers
- `deps/sqlite3/sqlite3.lib` — Pre-compiled static library (Windows)
- `deps/sqlite3/libsqlite3.a` — Pre-compiled static library (Linux/macOS)
- `lib/` — JavaScript API layer (Database, Statement, Transaction, etc.)

The SQLite engine is **pre-compiled as a static library** and linked at build time.
This avoids recompiling ~245k lines of C on every `npm install`.

## Installation

```bash
npm install
```

The install script uses `prebuild-install` to download pre-built binaries.
Falls back to `node-gyp rebuild` only if no prebuild is available.

## Building from Source

### Prerequisites

- Node.js 18+
- Python 3.11+
- Visual Studio Build Tools 2022 with C++ workload (Windows)
- GCC/Clang with C++17 support (Linux/macOS)

### One-time: Build the SQLite static library

If `deps/sqlite3/sqlite3.lib` (or `.a`) doesn't exist yet:

```bash
node scripts/build-sqlite3-lib.js
```

This compiles `deps/sqlite3/sqlite3.c` into a static library once.
After that, commit the `.lib`/`.a` and you never need to recompile SQLite again.

### Build the N-API wrapper

```bash
npm run build
```

### Generate prebuilds

```bash
npm run prebuild
```

## Usage

```javascript
const { openDatabase } = require('hexcore-better-sqlite3');

const db = openDatabase(':memory:');
db.exec('CREATE TABLE kv (id INTEGER PRIMARY KEY, value TEXT)');
db.prepare('INSERT INTO kv(value) VALUES (?)').run('hello');
const row = db.prepare('SELECT value FROM kv WHERE id = 1').get();
console.log(row.value); // 'hello'
db.close();
```

## Testing

```bash
npm test
```

## License

MIT
