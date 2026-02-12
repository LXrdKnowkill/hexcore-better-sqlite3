/**
 * HexCore Better-SQLite3 - ESM Wrapper
 *
 * Copyright (c) HikariSystem. All rights reserved.
 * Licensed under MIT License.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const binding = require('./index.js');

export const {
	Database,
	SqliteError,
	openDatabase,
	resolveNativeBinaryPath,
} = binding;

export default binding;
