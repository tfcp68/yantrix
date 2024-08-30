import { readFile } from 'node:fs/promises';
import { format } from 'prettier';

export async function fmt(code: string, cfg: string): Promise<string> {
	try {
		const prettierCfgRaw = await readFile(cfg, 'utf-8');
		const prettierCfg = JSON.parse(prettierCfgRaw);
		return format(code, { ...prettierCfg, parser: 'babel-ts' });
	} catch {
		return code;
	}
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
