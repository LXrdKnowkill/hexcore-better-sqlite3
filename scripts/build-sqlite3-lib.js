/**
 * Build SQLite3 as a static library for the current platform.
 *
 * This script compiles deps/sqlite3/sqlite3.c into a static library
 * (sqlite3.lib on Windows, libsqlite3.a on Linux/macOS) and places
 * the result alongside the header in deps/sqlite3/.
 *
 * Run this ONCE to generate the static lib, then commit it.
 * After that, binding.gyp only links against the pre-built lib
 * instead of recompiling 245k lines of C every time.
 *
 * Usage: node scripts/build-sqlite3-lib.js
 */

'use strict';

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const depsDir = path.resolve(__dirname, '..', 'deps', 'sqlite3');
const sourceFile = path.join(depsDir, 'sqlite3.c');
const includeDir = path.join(depsDir, 'include');

if (!fs.existsSync(sourceFile)) {
	console.error('sqlite3.c not found in deps/sqlite3/');
	process.exit(1);
}

// Ensure include/ directory exists with the header
fs.mkdirSync(includeDir, { recursive: true });
for (const header of ['sqlite3.h', 'sqlite3ext.h']) {
	const src = path.join(depsDir, header);
	const dst = path.join(includeDir, header);
	if (fs.existsSync(src) && !fs.existsSync(dst)) {
		fs.copyFileSync(src, dst);
	}
}

// SQLite compile-time defines (matching the original defines.gypi)
const defines = [
	'HAVE_STDINT_H=1',
	'HAVE_USLEEP=1',
	'SQLITE_DEFAULT_CACHE_SIZE=-16000',
	'SQLITE_DEFAULT_FOREIGN_KEYS=1',
	'SQLITE_DEFAULT_MEMSTATUS=0',
	'SQLITE_DEFAULT_WAL_SYNCHRONOUS=1',
	'SQLITE_DQS=0',
	'SQLITE_ENABLE_COLUMN_METADATA',
	'SQLITE_ENABLE_DBSTAT_VTAB',
	'SQLITE_ENABLE_DESERIALIZE',
	'SQLITE_ENABLE_FTS3',
	'SQLITE_ENABLE_FTS3_PARENTHESIS',
	'SQLITE_ENABLE_FTS4',
	'SQLITE_ENABLE_FTS5',
	'SQLITE_ENABLE_GEOPOLY',
	'SQLITE_ENABLE_JSON1',
	'SQLITE_ENABLE_MATH_FUNCTIONS',
	'SQLITE_ENABLE_RTREE',
	'SQLITE_ENABLE_STAT4',
	'SQLITE_ENABLE_UPDATE_DELETE_LIMIT',
	'SQLITE_LIKE_DOESNT_MATCH_BLOBS',
	'SQLITE_OMIT_DEPRECATED',
	'SQLITE_OMIT_PROGRESS_CALLBACK',
	'SQLITE_OMIT_SHARED_CACHE',
	'SQLITE_OMIT_TCL_VARIABLE',
	'SQLITE_SOUNDEX',
	'SQLITE_THREADSAFE=2',
	'SQLITE_TRACE_SIZE_LIMIT=32',
	'SQLITE_USE_URI=0',
	'NDEBUG',
];

const defineFlags = defines.map(d => `-D${d}`);

const objFile = path.join(depsDir, 'sqlite3' + (process.platform === 'win32' ? '.obj' : '.o'));

function findVcvarsall() {
	const { execSync: ex } = require('child_process');
	try {
		const vswhere = path.join(
			process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)',
			'Microsoft Visual Studio', 'Installer', 'vswhere.exe'
		);
		const installPath = ex(`"${vswhere}" -latest -property installationPath`, { encoding: 'utf8' }).trim();
		const vcvars = path.join(installPath, 'VC', 'Auxiliary', 'Build', 'vcvars64.bat');
		if (fs.existsSync(vcvars)) return vcvars;
	} catch { }
	return null;
}

if (process.platform === 'win32') {
	const vcvars = findVcvarsall();
	if (!vcvars) {
		console.error('Could not find vcvars64.bat. Install Visual Studio Build Tools 2022 with C++ workload.');
		process.exit(1);
	}

	// MSVC: compile to .obj then create .lib (via vcvars64 environment)
	const clDefines = defineFlags.map(d => d.replace('-D', '/D')).join(' ');
	const compileCmd = `"${vcvars}" >nul 2>&1 && cl.exe /nologo /c /O2 /MT /W0 ${clDefines} /Fo"${objFile}" "${sourceFile}"`;
	console.log('Compiling sqlite3.c with MSVC...');
	execSync(compileCmd, { stdio: 'inherit', cwd: depsDir, shell: 'cmd.exe' });

	const libFile = path.join(depsDir, 'sqlite3.lib');
	const libCmd = `"${vcvars}" >nul 2>&1 && lib.exe /nologo /OUT:"${libFile}" "${objFile}"`;
	console.log('Creating sqlite3.lib...');
	execSync(libCmd, { stdio: 'inherit', cwd: depsDir, shell: 'cmd.exe' });

	// Cleanup .obj
	if (fs.existsSync(objFile)) fs.unlinkSync(objFile);
	console.log(`Created: ${libFile}`);

} else {
	// GCC/Clang: compile to .o then create .a
	const cc = process.env.CC || 'cc';
	const ccArgs = [
		cc,
		'-c',
		'-O3',
		'-fPIC',
		'-std=c99',
		'-w',
		...defineFlags,
		'-o', objFile,
		sourceFile,
	];
	console.log(`Compiling sqlite3.c with ${cc}...`);
	execSync(ccArgs.join(' '), { stdio: 'inherit', cwd: depsDir });

	const libFile = path.join(depsDir, 'libsqlite3.a');
	console.log('Creating libsqlite3.a...');
	execSync(`ar rcs ${libFile} ${objFile}`, { stdio: 'inherit', cwd: depsDir });

	// Cleanup .o
	if (fs.existsSync(objFile)) fs.unlinkSync(objFile);
	console.log(`Created: ${libFile}`);
}

console.log('\nDone! The static library is ready in deps/sqlite3/.');
console.log('You can now run `npm run build` to compile the N-API wrapper.');
console.log('\nAfter verifying, commit the .lib/.a file and remove sqlite3.c from the repo.');
