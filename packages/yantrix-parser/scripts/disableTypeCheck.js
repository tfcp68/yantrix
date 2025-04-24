import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const targetDir = path.resolve(__dirname, '../src/generated');

fs.readdirSync(targetDir, { recursive: true })
	.filter(file => file.endsWith('.ts'))
	.forEach((file) => {
		const filePath = path.join(targetDir, file);
		const data = fs.readFileSync(filePath);
		const fd = fs.openSync(filePath, 'w+');
		const insert = Buffer.from('/* eslint-disable */\n// @ts-nocheck\n');
		fs.writeSync(fd, insert, 0, insert.length, 0);
		fs.writeSync(fd, data, 0, data.length, insert.length);
		fs.close(fd, (err) => {
			if (err) throw err;
		});
		console.log(`Processed: ${file}`);
	});
