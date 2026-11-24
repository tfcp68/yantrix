import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { generateAutomataFromStateDiagram } from '@yantrix/codegen';
import { createStateDiagram, parseStateDiagram } from '@yantrix/mermaid-parser';

const fixtures = {
	'traffic-light.mermaid': 'TrafficLightAutomata',
	'game_phase.mermaid': 'GamePhaseAutomataTest',
};
const generatedDir = new URL('./generated/', import.meta.url);
mkdirSync(generatedDir, { recursive: true });

for (const [diagram, className] of Object.entries(fixtures)) {
	const source = readFileSync(new URL(`./diagrams/${diagram}`, import.meta.url), 'utf8');
	const matrix = await createStateDiagram(await parseStateDiagram(source));
	const code = await generateAutomataFromStateDiagram(matrix, { className, outLang: 'typescript' });

	const output = new URL(`${className}_generated.ts`, generatedDir);
	const temporary = new URL(`${className}.${process.pid}.tmp`, generatedDir);
	writeFileSync(temporary, code);
	renameSync(temporary, output);
}
