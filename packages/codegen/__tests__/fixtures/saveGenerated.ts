import { createStateDiagram, parseStateDiagram } from '@yantrix/mermaid-parser';
import { generateAutomataFromStateDiagram, generateJavaAutomata, ModuleNames } from '../../src/index.js';
import * as fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const pathSave = path.resolve(dirname);

const input1 = `stateDiagram-v2
[*] --> INIT: RESET
INIT --> INTRO: RUN
INTRO --> MAIN_MENU: TO_MENU
MAIN_MENU --> [*]: EXIT
MAIN_MENU --> MAIN_MENU: MENU_HOVER
MAIN_MENU --> GAME_LOBBY: CREATE_GAME
MAIN_MENU --> GAME_LOBBY: JOIN_GAME
GAME_LOBBY --> [*]: EXIT
GAME_LOBBY --> MAIN_MENU: TO_MENU
GAME_LOBBY --> GAME_STARTING: START_GAME
GAME_STARTING --> IN_GAME: BEGIN_GAME
IN_GAME --> [*]: EXIT
IN_GAME --> SCORE_SCREEN: END_GAME
IN_GAME --> MAIN_MENU: TO_MENU
SCORE_SCREEN --> MAIN_MENU: TO_MENU
SCORE_SCREEN --> [*]: EXIT`;

const includeNotesInput = `
stateDiagram-v2
[*] --> A: toA (a1,a2,a3)
A --> AA: toAA
[*] --> B: toB (a1,a2,a3)
[*] --> C: toC (newInteger)
[*] --> D: toD (a1='string', a2=3, a3=[])
[*] --> F: toF (a1='string', a2=3, a3=[])
[*] --> G: toG (a1, a2, a3)
[*] --> H: toH (a1, a2, a3)
[*] --> J: toJ (a1, a2, a3)
note left of A
#{a=4} <= 3
end note

`;

/*
note left of AA
#{a1,a2,a3}
end note

// note left of H
// #{a1='string',a2=3,a3=[]} <= (a1,a2,a3)
// end note

// note left of F
// #{a1=[],a2='string',a3=3} <= (a1='string',a2=3,a3=[])
// end note

// note left of G
// #{a1=[],a2='string',a3=3} <= (a1,a2,a3)
// end note

// note left of D
// #{a1,a2,a3} <= (a1='string',a2=3,a3=[])
// end note

// note left of B
// #{a1,a2,a3} <= (a1,a2,a3)
// end note

// note left of C
// #{integer} <= (newInteger)
// end note

note left of [*]
#{integer=3, string="str", array=[]}
end note
*/

const diagramsInput = {
	gameDiagram: {
		value: input1,
		automataName: 'GamePhaseAutomata',
	},
	includeNotes: {
		value: includeNotesInput,
		automataName: 'AutomataIncludeNotes',
	},
} as const;

Object.values(diagramsInput).forEach(async (fixture) => {
	const stateDiagramStructure = await parseStateDiagram(fixture.value);
	const stateDiagram = await createStateDiagram(stateDiagramStructure);

	const generatedAutomataOutput = await generateAutomataFromStateDiagram(stateDiagram, {
		className: fixture.automataName,
		outLang: ModuleNames.TypeScript,
	});

	const ignoreFlags = '/* eslint-disable */\n// @ts-nocheck';
	const writable = `${ignoreFlags}\n${generatedAutomataOutput}`;

	fs.writeFileSync(path.resolve(pathSave, `${fixture.automataName}_generated.ts`), writable, {
		encoding: 'utf8',
	});
});

const diagram = await createStateDiagram(await parseStateDiagram(input1));
const automata = await generateJavaAutomata(diagram, {
	className: 'GeneratedAutomata',
	outLang: ModuleNames.Java,
});
fs.writeFileSync(path.resolve(pathSave, 'GeneratedAutomata_generated.java'), automata, {
	encoding: 'utf-8',
});
