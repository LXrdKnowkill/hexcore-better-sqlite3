/**
 * HexCore Better-SQLite3 - IOC Integration Test
 * Simulates the exact usage pattern from hexcore-ioc/src/iocMatchStore.ts
 */

'use strict';

const sqlite = require('..');
const { openDatabase } = sqlite;
const path = require('path');
const fs = require('fs');
const os = require('os');

console.log('=== HexCore IOC Integration Test ===\n');

// 1. Test openDatabase with :memory: (same as IOC store)
console.log('1. Opening in-memory database (IOC pattern)...');
const db = openDatabase(':memory:');
console.assert(db.open === true, 'Database should be open');
console.log('   [PASS]\n');

// 2. Test PRAGMA settings (same as IOC store)
console.log('2. Setting PRAGMAs (IOC pattern)...');
db.exec(`
	PRAGMA journal_mode = WAL;
	PRAGMA synchronous = NORMAL;
	PRAGMA temp_store = MEMORY;
	PRAGMA cache_size = -32000;
`);
console.log('   [PASS]\n');

// 3. Create IOC table (same schema as IOC store)
console.log('3. Creating IOC table...');
db.exec(`
	CREATE TABLE IF NOT EXISTS ioc_matches (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		category TEXT NOT NULL,
		value TEXT NOT NULL,
		value_lower TEXT NOT NULL,
		offset INTEGER NOT NULL,
		encoding TEXT NOT NULL,
		context TEXT NOT NULL,
		UNIQUE(category, value_lower)
	);
	CREATE INDEX IF NOT EXISTS idx_ioc_matches_category_offset
		ON ioc_matches(category, offset);
`);
console.log('   [PASS]\n');

// 4. Prepare statements (same as IOC store)
console.log('4. Preparing statements...');
const insertStmt = db.prepare(`
	INSERT OR IGNORE INTO ioc_matches (
		category, value, value_lower, offset, encoding, context
	) VALUES (?, ?, ?, ?, ?, ?)
`);

const selectStmt = db.prepare(`
	SELECT value, offset, encoding, context
	FROM ioc_matches
	WHERE category = ?
	ORDER BY offset ASC
`);
console.log('   [PASS]\n');

// 5. Insert IOC matches (same pattern as addMatch)
console.log('5. Inserting IOC matches...');
const testData = [
	['url', 'http://malware.example.com/payload', 'http://malware.example.com/payload', 0x1000, 'ASCII', '...GET /payload HTTP/1.1...'],
	['url', 'https://c2.evil.net/beacon', 'https://c2.evil.net/beacon', 0x2000, 'ASCII', '...POST /beacon...'],
	['ip', '192.168.1.100', '192.168.1.100', 0x3000, 'ASCII', '...connect 192.168.1.100:443...'],
	['ip', '10.0.0.1', '10.0.0.1', 0x3500, 'UTF-16LE', '...10.0.0.1...'],
	['registry', 'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', 'hklm\\software\\microsoft\\windows\\currentversion\\run', 0x4000, 'ASCII', '...RegSetValue...'],
	['filepath', 'C:\\Windows\\System32\\cmd.exe', 'c:\\windows\\system32\\cmd.exe', 0x5000, 'UTF-16LE', '...CreateProcess...'],
];

let insertedCount = 0;
for (const [category, value, valueLower, offset, encoding, context] of testData) {
	const result = insertStmt.run(category, value, valueLower, offset, encoding, context);
	if (result.changes > 0) insertedCount++;
}
console.assert(insertedCount === 6, `Expected 6 inserts, got ${insertedCount}`);
console.log(`   Inserted ${insertedCount} IOC matches`);

// Test dedup (INSERT OR IGNORE)
const dupResult = insertStmt.run('url', 'http://malware.example.com/payload', 'http://malware.example.com/payload', 0x9999, 'ASCII', 'dup');
console.assert(dupResult.changes === 0, 'Duplicate should be ignored');
console.log('   Dedup working correctly');
console.log('   [PASS]\n');

// 6. Query by category (same pattern as snapshot)
console.log('6. Querying by category (snapshot pattern)...');
const urls = selectStmt.all('url');
console.assert(urls.length === 2, `Expected 2 URLs, got ${urls.length}`);
console.log(`   URLs: ${urls.length}`);

const ips = selectStmt.all('ip');
console.assert(ips.length === 2, `Expected 2 IPs, got ${ips.length}`);
console.log(`   IPs: ${ips.length}`);

const registries = selectStmt.all('registry');
console.assert(registries.length === 1, `Expected 1 registry, got ${registries.length}`);
console.log(`   Registry keys: ${registries.length}`);

const filepaths = selectStmt.all('filepath');
console.assert(filepaths.length === 1, `Expected 1 filepath, got ${filepaths.length}`);
console.log(`   File paths: ${filepaths.length}`);
console.log('   [PASS]\n');

// 7. Verify row structure matches IOC expectations
console.log('7. Verifying row structure...');
const firstUrl = urls[0];
console.assert(typeof firstUrl.value === 'string', 'value should be string');
console.assert(typeof firstUrl.offset === 'number', 'offset should be number');
console.assert(typeof firstUrl.encoding === 'string', 'encoding should be string');
console.assert(typeof firstUrl.context === 'string', 'context should be string');
console.log(`   Row: value="${firstUrl.value}", offset=0x${firstUrl.offset.toString(16)}, encoding=${firstUrl.encoding}`);
console.log('   [PASS]\n');

// 8. Test file-based database (IOC with sqlitePath)
console.log('8. Testing file-based database...');
const tmpDir = path.join(os.tmpdir(), 'hexcore-ioc-test');
fs.mkdirSync(tmpDir, { recursive: true });
const dbPath = path.join(tmpDir, `test-${Date.now()}.db`);

const fileDb = openDatabase(dbPath);
fileDb.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT)');
fileDb.prepare('INSERT INTO test(data) VALUES (?)').run('file-based');
const fileRow = fileDb.prepare('SELECT data FROM test').get();
console.assert(fileRow.data === 'file-based', 'File DB should work');
fileDb.close();

// Cleanup
try { fs.unlinkSync(dbPath); } catch { }
try { fs.unlinkSync(dbPath + '-shm'); } catch { }
try { fs.unlinkSync(dbPath + '-wal'); } catch { }
try { fs.rmdirSync(tmpDir); } catch { }
console.log('   [PASS]\n');

// 9. Close and cleanup
console.log('9. Closing database...');
db.close();
console.assert(db.open === false, 'Database should be closed');
console.log('   [PASS]\n');

console.log('=== All IOC integration tests passed! ===');
