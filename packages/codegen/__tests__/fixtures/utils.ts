import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateAutomataFromStateDiagram, TOutLang } from '../../src';
import { createStateDiagram, parseStateDiagram } from '@yantrix/mermaid-parser';
import fs from 'node:fs';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const pathSave = path.resolve(dirname);
const langToExt: Record<TOutLang, string> = {
	JavaScript: 'js',
	TypeScript: 'ts',
	Java: 'java',
	Python: 'py',
};

type TGenerateAutomataParams = {
	input: string;
	lang: TOutLang;
	automataName: string;
	constants?: string;
};

export const saveFile = async (fileName: string, content: string, ext: string) => {
	if (!fs.existsSync(path.resolve(pathSave, 'generated'))) {
		await fs.mkdirSync(path.resolve(pathSave, 'generated'));
	}
	await fs.writeFileSync(path.resolve(pathSave, `generated/${fileName}_generated.${ext}`), content);
};

export const generateAutomata = async (options: TGenerateAutomataParams) => {
	const stateDiagramStructure = await parseStateDiagram(options.input);
	const stateDiagram = await createStateDiagram(stateDiagramStructure);

	const generatedAutomataOutput = await generateAutomataFromStateDiagram(stateDiagram, {
		className: options.automataName,
		outLang: options.lang,
		constants: options.constants,
	});

	return generatedAutomataOutput;
};

export const saveAndGenerate = async (options: TGenerateAutomataParams, fileName: string) => {
	const ext = langToExt[options.lang];
	const automata = await generateAutomata(options);

	try {
		await saveFile(fileName, automata, ext);
	} catch (error) {}
};

export const mapFromObjectToString = (a: Record<string, any>, startSymbol: string = '') => {
	return Object.entries(a)
		.map(([key, value]) => {
			if (value === null) {
				return `${startSymbol}${key}`;
			}
			if (typeof value === 'string') return `${startSymbol}${key}="${value}"`;

			return `${startSymbol}${key}=${value}`;
		})
		.join(',');
};

export const mapFromStringToObject = (a: string) =>
	a.split(',').reduce((acc, el) => {
		const [key, value] = el.split('=');
		acc[key] = value || null;
		return acc;
	}, {});

export const objectKeysToString = (obj: Record<string, any>, startSymbol: string = '') =>
	Object.keys(obj)
		.map((el) => `${startSymbol}${el}`)
		.join(',');
