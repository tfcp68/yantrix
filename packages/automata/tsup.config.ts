import { readdirSync } from 'node:fs';
import { sep } from 'node:path';
import { createTsupConfig } from '../../tsup.config.js';

const sources = readdirSync('src', { recursive: true }).filter(file => file.endsWith('.ts'));
const entry = Object.fromEntries(sources.map((file) => {
	const sourcePath = file.split(sep).join('/');
	const name = sourcePath.replace(/\.ts$/, '').replace(/\/index$/, '');
	return [name === 'index' ? name : `modules/${name}`, `src/${file}`];
}));

export default createTsupConfig({ entry, splitting: true });
