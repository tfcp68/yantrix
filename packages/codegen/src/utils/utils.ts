import { JavaScriptTemplate } from '../core/templates/JavaScript';

export function replaceFileContents(replacementMap: Record<string, string>): string {
	let res = JavaScriptTemplate;
	Object.entries(replacementMap).forEach(([template, str]) => {
		res = res.replaceAll(template, str);
	});
	return res;
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
