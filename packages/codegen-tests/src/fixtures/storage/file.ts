import { existsSync } from 'node:fs';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { IStorageAdapter } from '@yantrix/core';

export function connect(filename: string, encoding: BufferEncoding = 'utf8'): IStorageAdapter<string> {
	return {
		id: filename,
		load: async () => existsSync(filename) ? readFile(filename, encoding) : null,
		save: theme => writeFile(filename, theme, encoding),
		clear: () => rm(filename, { force: true }),
	};
}
