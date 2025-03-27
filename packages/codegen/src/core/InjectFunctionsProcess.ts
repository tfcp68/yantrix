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
