import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, '../src/core/templates');
const dst = resolve(__dirname, '../dist/templates');

if (!existsSync(src)) {
	console.error(`Templates source not found: ${src}`);
	process.exit(1);
}

mkdirSync(dst, { recursive: true });
cpSync(src, dst, { recursive: true });
console.log(`Templates copied: ${src} -> ${dst}`);
