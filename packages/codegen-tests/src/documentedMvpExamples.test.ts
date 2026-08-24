import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ModuleNames } from '@yantrix/codegen';
import { describe, expect, it } from 'vitest';

import { generateAutomata } from './fixtures/utils';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(dirname, '../../../docs/examples');

function readStateDiagram(fileName: string): string {
	const markdown = fs.readFileSync(path.join(docsRoot, fileName), 'utf8');
	const diagrams = [...markdown.matchAll(/```mermaid\n(stateDiagram-v2[\s\S]*?)```/g)];
	if (diagrams.length !== 1 || diagrams[0]?.[1] == null) {
		throw new Error(`${fileName} must contain exactly one Mermaid state diagram`);
	}
	return diagrams[0][1];
}

describe('documented MVP examples', () => {
	it.each([
		['500_effect_counter.md', 'CounterFlow', 'scoreChanged'],
		['1000_todo.md', 'TodoFlow', 'todoAdded'],
	] as const)('generates the Effect Matrix and Slice documented in %s', async (
		fileName,
		className,
		effectName,
	) => {
		const source = await generateAutomata({
			input: readStateDiagram(fileName),
			automataName: className,
			lang: ModuleNames.TypeScript,
		});

		expect(source).toContain(`create${className}EffectMatrix`);
		expect(source).toContain(`create${className}Slice`);
		expect(source).toContain(`[eventDictionary["${effectName}"]]`);
	});
});
