import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateAutomataFromStateDiagram } from '@yantrix/codegen';
import { createStateDiagram, parseStateDiagram } from '@yantrix/mermaid-parser';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const diagramsDir = path.join(dirname, 'diagrams');
const outDir = path.join(dirname, 'generated');

const tasks = {
	'traffic-light.mermaid': { className: 'TrafficLightAutomata', outFile: 'TrafficLightAutomata_generated.ts' },
	'game_phase.mermaid': { className: 'GamePhaseAutomata', outFile: 'GamePhaseAutomataTest_generated.ts' },
	'traffic-light_two_counters.mermaid': { className: 'TrafficLightAutomataTwoCounters', outFile: 'TrafficLightAutomataTwoCounters_generated.ts' },
};

fs.mkdirSync(outDir, { recursive: true });

for (const [diagram, { className, outFile }] of Object.entries(tasks)) {
	const input = fs.readFileSync(path.join(diagramsDir, diagram), 'utf8');
	const structure = await parseStateDiagram(input);
	const stateDiagram = await createStateDiagram(structure);
	const code = await generateAutomataFromStateDiagram(stateDiagram, { className, outLang: 'typescript' });
	fs.writeFileSync(path.join(outDir, outFile), code);
}
