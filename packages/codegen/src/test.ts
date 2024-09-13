import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDir } from 'fs-extra';
import { createStateDiagram, parseStateDiagram } from '@yantrix/mermaid-parser';
import { TOutLang, generateAutomataFromStateDiagram } from '.';

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

async function generateAutomata(options: TGenerateAutomataParams) {
	const stateDiagramStructure = await parseStateDiagram(options.input);
	const stateDiagram = await createStateDiagram(stateDiagramStructure);

	const generatedAutomataOutput = await generateAutomataFromStateDiagram(stateDiagram, {
		className: options.automataName,
		outLang: options.lang,
		constants: options.constants!,
	});

	return generatedAutomataOutput;
}

async function saveAndGenerate(options: TGenerateAutomataParams, fileName: string) {
	const ext = langToExt[options.lang];
	const automata = await generateAutomata(options);

	try {
		await saveFile(fileName, automata, ext);
	} catch (error) {
		console.error(error);
	}
}

async function saveFile(fileName: string, content: string, ext: string) {
	ensureDir(path.resolve(pathSave, `generated`));
	fs.writeFileSync(path.resolve(pathSave, `generated/${fileName}_generated.${ext}`), content);
}

const input = `stateDiagram-v2
	direction TB
	[*] --> INIT: START (counter)
	INIT --> WORKING: [-]
	state isFinished <<choice>>
	WORKING --> isFinished: REDUCE (value)
	isFinished --> END: isGreater($value, #counter)
    isFinished --> NEW: test()
	isFinished --> WORKING
	note right of INIT
		+ByPass
		+Init
		#{counter} <= $counter = 10
	end note
	note left of WORKING
		#{counter} <= add(#counter, neg($value = 1))
	end note
	note right of END
		#{counter} <= 0
	end note`;

await saveAndGenerate({ input, automataName: 'ChoiceTest', lang: 'JavaScript' }, 'choice_node');
