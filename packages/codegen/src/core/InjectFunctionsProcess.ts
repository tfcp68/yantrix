import path from 'node:path';
import { TNullable } from '@yantrix/utils';
import { TOutLang, TUserFunctionsDict } from '../types/common';
import { ModuleNames } from './modules';

const processFileTS = async (filePath: TNullable<string>): Promise<TUserFunctionsDict> => {
	if (!filePath) {
		return {
			path: null,
		};
	}
	const fileExtension = path.extname(filePath);

	if (!['.js', '.ts'].includes(fileExtension)) {
		throw new Error('Only .js or .ts files are supported');
	}

	return {
		path: filePath,
	};
};

const processFilePy = async (filePath: TNullable<string>): Promise<TUserFunctionsDict> => {
	if (!filePath) return { path: null };
	if (path.extname(filePath) !== '.py') throw new Error('Only .py files are supported for Python inject');
	return { path: filePath };
};

const processFileDict: Record<TOutLang, (filePath: TNullable<string>) => Promise<TUserFunctionsDict>> = {
	[ModuleNames.JavaScript]: processFileTS,
	[ModuleNames.TypeScript]: processFileTS,
	[ModuleNames.PureJavaScript]: processFileTS,
	[ModuleNames.PureTypeScript]: processFileTS,
	[ModuleNames.Python]: processFilePy,
	[ModuleNames.Java]: (filePath) => {
		if (filePath) throw new TypeError('Java does not support inject functions via file path');
		return Promise.resolve({ path: null });
	},
} as const;

export const processFile = (language: TOutLang) => {
	if (processFileDict[language]) {
		return processFileDict[language];
	}
	throw new TypeError(`Language ${language} is not supported`);
};
