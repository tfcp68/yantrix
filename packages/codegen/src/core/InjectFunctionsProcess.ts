import { readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { TNullable } from '@yantrix/utils';
import ts from 'typescript';
import { TOutLang, TUserFunctionsDict } from '../types/common';
import { ModuleNames } from './modules';

const processFileTS = async (filePath: TNullable<string>): Promise<TUserFunctionsDict> => {
	if (!filePath) return null;
	const fileExtension = path.extname(filePath);

	if (!['.js', '.ts'].includes(fileExtension)) {
		throw new Error('Only .js or .ts files are supported');
	}

	if (fileExtension === '.js') {
		return await import(filePath);
	}

	const fileContent = await readFile(filePath, 'utf8');

	const result = ts.transpileModule(fileContent, {
		compilerOptions: {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2015,
		},
	});

	const tempJsPath = path.join(path.dirname(filePath), '_temp.js');
	await writeFile(tempJsPath, result.outputText);

	const functions = await import(tempJsPath);
	await unlink(tempJsPath);

	return functions;
};

const processFileDict: Record<TOutLang, (filePath: TNullable<string>) => Promise<TUserFunctionsDict>> = {
	[ModuleNames.JavaScript]: processFileTS,
	[ModuleNames.TypeScript]: processFileTS,
	[ModuleNames.Python]: () => { throw new TypeError('Python is not supported yet inject functions'); },
	[ModuleNames.Java]: () => { throw new TypeError('Java is not supported yet inject functions'); },

} as const;

export const processFile = (language: TOutLang) => {
	if (processFileDict[language]) {
		return processFileDict[language];
	}
	throw new TypeError(`Language ${language} is not supported`);
};
