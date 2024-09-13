import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { format } from 'prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function fmt(code: string, cfg: string): Promise<string> {
	try {
		const prettierCfgRaw = await readFile(cfg, 'utf-8');
		const prettierCfg = JSON.parse(prettierCfgRaw);
		return format(code, { ...prettierCfg, parser: 'babel-ts' });
	} catch {
		return code;
	}
}

export function getFileContents(filePath: string): string {
	return fs.readFileSync(path.resolve(__dirname, filePath)).toString();
}

export function replaceFileContents(filePath: string, replacementMap: Record<string, string>): string {
	let contents = getFileContents(filePath);
	Object.entries(replacementMap).forEach(([template, str]) => {
		contents = contents.replaceAll(template, str);
	});
	return contents;
}

/**
 * Преобразует ключи объекта в число
 */
export function convertKeysToNumberString(obj: object): string {
	if (typeof obj !== 'object' || obj === null)
		return JSON.stringify(obj);

	let result = '{';
	let first = true;
	for (const [key, value] of Object.entries(obj)) {
		if (!first)
			result += ',';
		first = false;
		result += `${Number(key)}:${convertKeysToNumberString(value)}`;
	}
	result += '}';
	return result;
}
