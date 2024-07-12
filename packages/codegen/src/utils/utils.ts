import { ITypedObject, ITypedObjectProps } from '../types/common.js';
import { readFile } from 'fs/promises';
import { format } from 'prettier';

export const toUpperFirst = (str: string) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

export const toTypedObjectProps = <T>(object: T, objName: string) => {
	const typeGuardName = `isValid${toUpperFirst(objName)}`;
	const typeName = `T${toUpperFirst(objName)}`;
	const body = JSON.stringify(object, null, 2);
	const name = `${objName}Obj`;

	return {
		typeName,
		typeGuardName,
		name,
		body,
	} satisfies ITypedObjectProps;
};

export const toTypedObject = <T>(obj: T, name: string) => {
	const props = toTypedObjectProps(obj, name);

	const codeBlock = `const ${props.name} = ${props.body}

		type ${props.typeName} = keyof typeof ${props.name}

		const ${props.typeGuardName} = (obj: any): obj is ${props.typeName} => {
			return Object.keys(${props.name}).includes(obj);
		}`;

	return {
		...props,
		codeBlock,
	} satisfies ITypedObject;
};

export const fmt = async (code: string, prettierCfgPath: string) => {
	try {
		const prettierCfgRaw = await readFile(prettierCfgPath, 'utf-8');
		const prettierCfg = JSON.parse(prettierCfgRaw);
		return format(code, { ...prettierCfg, parser: 'babel-ts' });
	} catch {
		return code;
	}
};

/**
 * Преобразует ключи объекта в число
 */
export const convertKeysToNumberString = (obj: object) => {
	if (typeof obj !== 'object' || obj === null) return JSON.stringify(obj);

	let result = '{';
	let first = true;
	for (const [key, value] of Object.entries(obj)) {
		if (!first) result += ',';
		first = false;
		result += `${Number(key)}:${convertKeysToNumberString(value)}`;
	}
	result += '}';
	return result;
};
