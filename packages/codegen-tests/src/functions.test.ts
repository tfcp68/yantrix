import { ModuleNames } from '@yantrix/codegen';
import { describe, it } from 'vitest';
import { generateAndSave } from './fixtures/utils';
import templates from './functions';

const generateAndGetAutomataModule = async (input: string, name: string) => {
	await generateAndSave({ input, automataName: 'Automata', lang: ModuleNames.JavaScript }, name);
	const path = `./fixtures/generated/${name}_generated.js`;
	return await import(path);
};

describe('functions', async () => {
	for (const template of templates) {
		const module = await generateAndGetAutomataModule(template.input, template.automataName);
		const iterations = template.getTestIterations(module);

		it(template.description, async () => {
			for (const iter of iterations) {
				await iter.function();
			}
		});
	}
});
