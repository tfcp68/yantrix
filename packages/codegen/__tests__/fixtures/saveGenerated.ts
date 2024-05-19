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

const diagramsInput = {
  gameDiagram: {
    value: input1,
    automataName: 'GamePhaseAutomata',
  },
} as const;

const fixturesList = [diagramsInput];

fixturesList.forEach(async (fixture) => {
  const stateDiagramStructure = await parseStateDiagram(
    fixture.gameDiagram.value,
  );
  const stateDiagram = await createStateDiagram(stateDiagramStructure);

  const generatedAutomataOutput = await generateAutomataFromStateDiagram(
    stateDiagram,
    {
      className: fixture.gameDiagram.automataName,
      outLang: 'TypeScript',
    },
  );

  fs.writeFileSync(
    path.resolve(pathSave, `${fixture.gameDiagram.automataName}_generated.ts`),
    generatedAutomataOutput,
    {
      encoding: 'utf8',
    },
  );
});
