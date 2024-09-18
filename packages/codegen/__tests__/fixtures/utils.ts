// import fs from 'node:fs';
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';
// import { createStateDiagram, parseStateDiagram } from '@yantrix/mermaid-parser';
// import { ensureDir } from 'fs-extra';
// import { generateAutomataFromStateDiagram } from '../../src';
// import { TOutLang } from '../../src/types/common';

// const filename = fileURLToPath(import.meta.url);
// const dirname = path.dirname(filename);

// const pathSave = path.resolve(dirname);
// const langToExt: Record<TOutLang, string> = {
// 	JavaScript: 'js',
// 	TypeScript: 'ts',
// 	Java: 'java',
// 	Python: 'py',
// };

// type TGenerateAutomataParams = {
// 	input: string;
// 	lang: TOutLang;
// 	automataName: string;
// 	constants?: string;
// };

// export async function saveFile(fileName: string, content: string, ext: string) {
// 	ensureDir(path.resolve(pathSave, `generated`));
// 	fs.writeFileSync(path.resolve(pathSave, `generated/${fileName}_generated.${ext}`), content);
// }

// export async function generateAutomata(options: TGenerateAutomataParams) {
// 	const stateDiagramStructure = await parseStateDiagram(options.input);
// 	const stateDiagram = await createStateDiagram(stateDiagramStructure);

// 	const generatedAutomataOutput = await generateAutomataFromStateDiagram(stateDiagram, {
// 		className: options.automataName,
// 		outLang: options.lang,
// 		constants: options.constants!,
// 	});

// 	return generatedAutomataOutput;
// }

// export async function saveAndGenerate(options: TGenerateAutomataParams, fileName: string) {
// 	const ext = langToExt[options.lang];
// 	const automata = await generateAutomata(options);

// 	try {
// 		await saveFile(fileName, automata, ext);
// 	} catch (error) {
// 		console.error(error);
// 	}
// }

// export function mapFromObjectToString(a: Record<string, any>, startSymbol: string = '') {
// 	return Object
// 		.entries(a)
// 		.map(([key, value]) => {
// 			if (value === null) {
// 				return `${startSymbol}${key}`;
// 			}
// 			if (typeof value === 'string') return `${startSymbol}${key}="${value}"`;

// 			return `${startSymbol}${key}=${value}`;
// 		})
// 		.join(',');
// }

// export function mapFromStringToObject(a: string) {
// 	return a.split(',').reduce((acc, el) => {
// 		const [key, value] = el.split('=');
// 		acc[key as keyof typeof acc] = value || null;
// 		return acc;
// 	}, Object.create(null));
// }

// export function objectKeysToString(obj: Record<string, any>, startSymbol: string = '') {
// 	return Object
// 		.keys(obj)
// 		.map(el => `${startSymbol}${el}`)
// 		.join(',');
// }
