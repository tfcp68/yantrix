import path from 'node:path';
import { ModuleNames } from '@yantrix/core';
import { describe, expect, it } from 'vitest';
import { generateAndSave } from './fixtures/utils.js';

describe('inject functions codegen', () => {
	it('inject functions should be injected in function dictionary', async () => {
		const input = `stateDiagram-v2
		[*] --> A: toA
    note right of [*]
			inject/isBoolean
		end note
		`;

		await generateAndSave({ input, automataName: 'Inject', lang: ModuleNames.JavaScript, injects: path.resolve('src', 'fixtures', 'injectFunctions.ts') }, 'Inject');
		const dictionary = (await import(`./fixtures/generated/Inject_generated.js`)).functionDictionary;

		expect(dictionary?.get('isBoolean')).toBeDefined();
	});

	it('should throw an error when injected function name conflicts with built-in identifier', async () => {
		const input = `stateDiagram-v2
		[*] --> A: toA
    note right of [*]
			inject/has
		end note
		`;

		const call = async () => await generateAndSave({ input, automataName: 'InjectInvalid', lang: ModuleNames.JavaScript, injects: path.resolve('src', 'fixtures', 'injectInvalid.ts') }, 'InjectInvalid');
		await expect(call).rejects.toThrowError();
	});

	it('should throw error when inject function is used without providing function file path', async () => {
		const input = `stateDiagram-v2
      [*] --> A: toA
      note right of [*]
        inject/isBoolean
      end note
    `;

		const call = async () => await generateAndSave({
			input,
			automataName: 'InjectMissingPath',
			lang: ModuleNames.JavaScript,
		}, 'InjectMissingPath');

		await expect(call).rejects.toThrowError();
	});
	it('should throw error when referenced inject function is missing from user function dictionary', async () => {
		const input = `stateDiagram-v2
			[*] --> A: toA
			note right of [*]
				inject/nonExistentFunction
			end note
		`;

		const call = async () => await generateAndSave({
			input,
			automataName: 'InjectMissingFunction',
			lang: ModuleNames.JavaScript,
			injects: path.resolve('src', 'fixtures', 'injectFunctions.ts'),
		}, 'InjectMissingFunction');

		await expect(call).rejects.toThrowError();
	});
});
