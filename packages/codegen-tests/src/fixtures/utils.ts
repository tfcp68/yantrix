import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateAutomataFiles, generateAutomataFromStateDiagram, ModuleNames, TOutLang } from '@yantrix/codegen';
import { createStateDiagram, parseStateDiagram } from '@yantrix/mermaid-parser';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const pathSave = path.resolve(dirname);
const langToExt: Record<TOutLang, string> = {
	[ModuleNames.JavaScript]: 'js',
	[ModuleNames.TypeScript]: 'ts',
	[ModuleNames.Java]: 'java',
	[ModuleNames.Python]: 'py',
	[ModuleNames.PureJavaScript]: 'js',
	[ModuleNames.PureTypeScript]: 'js',
};

export type TFSMAdapter = {
	dispatch: (ap: { action: number; payload: Record<string, unknown> | null }) => { state: number; context: Record<string, unknown> };
	getContext: () => { state: number; context: Record<string, unknown> };
	readonly state: number;
	readonly lastAction: number | null;
	readonly currentCycle: number;
};

export interface IFSMInstanceBase {
	dispatch: (ap: { action: number; payload: Record<string, unknown> | null }) => { state: number; context: Record<string, unknown> };
	getContext: () => { state: number; context: Record<string, unknown> };
	state: number | null;
	lastAction: number | null;
	currentCycle: number;
}

export function wrapInstance(inst: IFSMInstanceBase): TFSMAdapter {
	return {
		dispatch: ap => inst.dispatch(ap),
		getContext: () => inst.getContext(),
		get state() { return inst.state ?? 0; },
		get lastAction() { return inst.lastAction; },
		get currentCycle() { return inst.currentCycle; },
	};
}

export const wrapClassInstance = wrapInstance;
export const wrapFunctionalInstance = wrapInstance;

type TGenerateAutomataParams = {
	input: string;
	lang: TOutLang;
	automataName: string;
	constants?: string;
	injects?: string;
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
		functionFilePath: options.injects,
	});

	return generatedAutomataOutput;
}

export async function generateAndSave(options: TGenerateAutomataParams, fileName: string) {
	const ext = langToExt[options.lang];
	const automata = await generateAutomata(options);

	saveFile(fileName, automata, ext);
}

export async function generateAndSaveFiles(options: TGenerateAutomataParams, fileName: string): Promise<string> {
	const stateDiagramStructure = await parseStateDiagram(options.input);
	const stateDiagram = await createStateDiagram(stateDiagramStructure);

	const files = await generateAutomataFiles(stateDiagram, {
		className: options.automataName,
		outLang: options.lang,
		constants: options.constants!,
		functionFilePath: options.injects,
	});

	const dir = path.resolve(pathSave, 'generated', fileName);
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

	let entryPath = '';
	for (const [relName, content] of Object.entries(files)) {
		const outPath = path.join(dir, relName);
		fs.writeFileSync(outPath, content);
		if (!entryPath && !relName.startsWith('runtime')) {
			entryPath = outPath;
		}
	}
	return entryPath;
}

export function mapFromObjectToString(a: Record<string, unknown>, startSymbol: string = '') {
	return Object
		.entries(a)
		.map(([key, value]) => {
			if (value === null) {
				return `${startSymbol}${key}`;
			}
			if (typeof value === 'string') return `${startSymbol}${key}="${value}"`;

			return `${startSymbol}${key}=${String(value)}`;
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

export function objectKeysToString(obj: Record<string, unknown>, startSymbol: string = '') {
	return Object
		.keys(obj)
		.map(el => `${startSymbol}${el}`)
		.join(',');
}
