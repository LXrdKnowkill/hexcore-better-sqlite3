'use strict';

const path = require('path');
const BetterSqlite3 = require('./lib/index.js');

function resolveNativeBinaryPath() {
	// HexCore: Adjusted to look in prebuilds
	const packageRoot = __dirname;
	return path.join(packageRoot, 'prebuilds', `${process.platform}-${process.arch}`, 'node.napi.node');
}

function openDatabase(filename, options) {
	return new BetterSqlite3(filename, options);
}

module.exports = BetterSqlite3;
module.exports.default = BetterSqlite3;
module.exports.Database = BetterSqlite3;
module.exports.openDatabase = openDatabase;
module.exports.resolveNativeBinaryPath = resolveNativeBinaryPath;

