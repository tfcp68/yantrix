import { createStateDiagram, parseStateDiagram } from '@yantrix/mermaid-parser';
import { generateAutomataFromStateDiagram } from '../../src/index.js';
import * as fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const pathSave = path.resolve(dirname);

const input1 = `stateDiagram-v2
[*] --> INIT: RESET
note left of [*] 
+INITIAL
end note
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

const input2 = `stateDiagram-v2
[*] --> CLOSED: RESET (list)
note left of [*]
+INITIAL
#{ items = []}
#{ selectedIndex = 0 }
end note
CLOSED --> OPEN: OPEN
OPEN --> CLOSED: CLOSE
OPEN --> SELECTED: SELECT (index)
SELECTED --> CLOSED: CLOSE
note left of CLOSED
#{ items } <= (list)
#{ selectedIndex = 0 } <= {index}
subscribe/click => OPEN
emit/dropdownClose
end note
note left of SELECTED
#{ selectedIndex } <= (index)
emit/selected <= (index)
subscribe/selected => CLOSE
end note
note right of OPEN
emit/dropdownOpen
subscribe/click => SELECT (index)
subscribe/clickOutside => CLOSE
end note
`;

const diagramsInput = [
	{
		value: input1,
		automataName: 'GamePhaseAutomata',
	},
	{
		value: input2,
		automataName: 'DropdownAutomata',
	},
] as const;

export const writeFile = () => {
	diagramsInput.forEach(async (fixture) => {
		const stateDiagramStructure = await parseStateDiagram(fixture.value);
		const stateDiagram = await createStateDiagram(stateDiagramStructure);

		const generatedAutomataOutput = await generateAutomataFromStateDiagram(stateDiagram, {
			className: fixture.automataName,
			outLang: 'TypeScript',
		});

		fs.writeFileSync(path.resolve(pathSave, `${fixture.automataName}_generated.ts`), generatedAutomataOutput, {
			encoding: 'utf8',
		});
	});
};
writeFile();
