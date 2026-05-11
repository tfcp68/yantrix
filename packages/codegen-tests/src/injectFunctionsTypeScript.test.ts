import { ModuleNames } from '@yantrix/codegen';
import { describe, expect, it } from 'vitest';
import { generateAutomata } from './fixtures/utils.js';

const correctFunctionsPath = '../../fixtures/injects/correctFunctions.ts';

const baseTemplate = `stateDiagram-v2
		[*] --> A: toA
		note right of [*]
			inject/isBoolean
		end note
`;

describe('inject functions codegen (TypeScript)', () => {
	it('emits namespace import for userFunctions when functionFilePath is set', async () => {
		const code = await generateAutomata({
			input: baseTemplate,
			automataName: 'InjectTS',
			lang: ModuleNames.TypeScript,
			injects: correctFunctionsPath,
		});

		expect(code).toMatch(/import \* as userFunctions from ['"][^'"]+['"];?/);
	});

	it('registers injected function via userFunctionsDict resolved from namespace import', async () => {
		const code = await generateAutomata({
			input: baseTemplate,
			automataName: 'InjectTS',
			lang: ModuleNames.TypeScript,
			injects: correctFunctionsPath,
		});

		expect(code).toMatch(/functionDictionary\.register\(["']isBoolean["'],\s*userFunctionsDict\[["']isBoolean["']\]\)/);
		expect(code).toMatch(/const userFunctionsDict = \(function \(\) \{/);
	});

	it('omits namespace import when functionFilePath is not provided', async () => {
		const cleanTemplate = `stateDiagram-v2
			[*] --> A: toA
		`;
		const code = await generateAutomata({
			input: cleanTemplate,
			automataName: 'NoInjectTS',
			lang: ModuleNames.TypeScript,
		});

		expect(code).not.toMatch(/import \* as userFunctions from/);
	});
});
