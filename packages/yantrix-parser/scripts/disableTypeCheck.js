import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';

const __dirname = dirname(fileURLToPath(import.meta.url));

const data = fs.readFileSync(path.resolve(__dirname, '../src/yantrixParser.ts'));
const fd = fs.openSync(path.resolve(__dirname, '../src/yantrixParser.ts'), 'w+');
const insert = Buffer.from('/* eslint-disable */\n// @ts-nocheck\n');
fs.writeSync(fd, insert, 0, insert.length, 0);
fs.writeSync(fd, data, 0, data.length, insert.length);
fs.close(fd, (err) => {
	if (err) throw err;
});
