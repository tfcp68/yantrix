import { createStateDiagram, parseStateDiagram } from '@yantrix/mermaid-parser';
import { generateAutomataFromStateDiagram, generateJavaAutomata } from '../../src/index.js';
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

const payloadSample = `
stateDiagram-v2
[*] --> payloadOnly: toPayloadOnly
note left of payloadOnly
#{a} <= $b
#{a1} <= $b1 = 5
#{a2 = 10} <= $b2
#{a3 = 'str'} <= $b3 = 'payloadStr'
#{a4} <= $b4 = $c
end note
`;

/*
note left of AA
#{a1,a2,a3}
end note

note left of H
#{a1='string',a2=3,a3=[]} <= (a1,a2,a3)
end note

note left of F
#{a1=[],a2='string',a3=3} <= (a1='string',a2=3,a3=[])
end note

note left of G
#{a1=[],a2='string',a3=3} <= (a1,a2,a3)
end note

note left of D
#{a1,a2,a3} <= (a1='string',a2=3,a3=[])
end note

note left of B
#{a1,a2,a3} <= (a1,a2,a3)
end note

note left of C
#{integer} <= (newInteger)
end note

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
		value: payloadSample,
		automataName: 'AutomataPayloadSample',
	},
} as const;

export const generateAndSaveAutomata = async (input: string, automataName: string) => {
	const stateDiagramStructure = await parseStateDiagram(input);
	const stateDiagram = await createStateDiagram(stateDiagramStructure);

	const generatedAutomataOutput = await generateAutomataFromStateDiagram(stateDiagram, {
		className: automataName,
		outLang: 'JavaScript',
	});

	fs.writeFileSync(path.resolve(pathSave, `${automataName}_generated.js`), generatedAutomataOutput, {
		encoding: 'utf8',
	});
};

Object.values(diagramsInput).forEach(async (fixture) => {
	const stateDiagramStructure = await parseStateDiagram(fixture.value);
	const stateDiagram = await createStateDiagram(stateDiagramStructure);

	const generatedAutomataOutput = await generateAutomataFromStateDiagram(stateDiagram, {
		className: fixture.automataName,
		outLang: 'JavaScript',
	});

	fs.writeFileSync(path.resolve(pathSave, `${fixture.automataName}_generated.ts`), generatedAutomataOutput, {
		encoding: 'utf8',
	});
});

const diagram = await createStateDiagram(await parseStateDiagram(input1));
const automata = await generateJavaAutomata(diagram, {
	className: 'GeneratedAutomata',
	outLang: 'Java',
});
fs.writeFileSync(path.resolve(pathSave, 'GeneratedAutomata_generated.java'), automata, {
	encoding: 'utf-8',
});
