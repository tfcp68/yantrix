import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateAutomataFromStateDiagram, ModuleNames, TOutLang } from '@yantrix/codegen';
import { createStateDiagram, parseStateDiagram } from '@yantrix/mermaid-parser';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const pathSave = path.resolve(dirname);
const langToExt: Record<TOutLang, string> = {
	[ModuleNames.JavaScript]: 'js',
	[ModuleNames.TypeScript]: 'ts',
	[ModuleNames.Java]: 'java',
	[ModuleNames.Python]: 'py',
};

type TGenerateAutomataParams = {
	input: string;
	lang: TOutLang;
	automataName: string;
	constants?: string;
};

export function saveFile(fileName: string, content: string, ext: string) {
	const dir = path.resolve(pathSave, `generated`);

	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(path.join(dir, `${fileName}_generated.${ext}`), content);
}

export async function generateAutomata(options: TGenerateAutomataParams) {
	const stateDiagramStructure = await parseStateDiagram(options.input);
	const stateDiagram = await createStateDiagram(stateDiagramStructure);

	const generatedAutomataOutput = await generateAutomataFromStateDiagram(stateDiagram, {
		className: options.automataName,
		outLang: options.lang,
		constants: options.constants!,
	});

	return generatedAutomataOutput;
}

export async function generateAndSave(options: TGenerateAutomataParams, fileName: string) {
	const ext = langToExt[options.lang];
	const automata = await generateAutomata(options);

	saveFile(fileName, automata, ext);
}

export function mapFromObjectToString(a: Record<string, any>, startSymbol: string = '') {
	return Object
		.entries(a)
		.map(([key, value]) => {
			if (value === null) {
				return `${startSymbol}${key}`;
			}
			if (typeof value === 'string') return `${startSymbol}${key}="${value}"`;

			return `${startSymbol}${key}=${value}`;
		})
		.join(',');
}

export function mapFromStringToObject(a: string) {
	return a.split(',').reduce((acc, el) => {
		const [key, value] = el.split('=');
		acc[key as keyof typeof acc] = value || null;
		return acc;
	}, Object.create(null));
}

export function objectKeysToString(obj: Record<string, any>, startSymbol: string = '') {
	return Object
		.keys(obj)
		.map(el => `${startSymbol}${el}`)
		.join(',');
}
