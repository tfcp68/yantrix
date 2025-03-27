import { ModuleNames } from '@yantrix/codegen';
import { describe, expect, it } from 'vitest';
import { generateAndSave } from './fixtures/utils.js';

const getPath = (file: string) => `../../fixtures/injects/${file}.ts`;
const functions = {
	correct: getPath('correctFunctions'),
	invalidInjectFunctions: getPath('functionIntersectionWithBuiltIn'),
	badDefaultFunctionExport: getPath('badExportDefaultFunction'),
	exportDefaultArray: getPath('exportDefaultArray'),
	exportArray: getPath('exportArray'),
	correctExportDefaultDict: getPath('correctExportDefaultDict'),
	badExportDefaultDict: getPath('badExportDefaultDict'),
};

const bastTemplate = `stateDiagram-v2
		[*] --> A: toA
    note right of [*]
			inject/isBoolean
		end note
		`;

describe('inject functions codegen', () => {
	it('should successfully inject functions into function dictionary', async () => {
		await generateAndSave({ input: bastTemplate, automataName: 'Inject', lang: ModuleNames.JavaScript, injects: functions.correct }, 'Inject');
		const dictionary = (await import(`./fixtures/generated/Inject_generated.js`)).functionDictionary;

		expect(dictionary?.get('isBoolean')).toBeDefined();
	});

	it('should successfully inject functions from export default dictionary', async () => {
		await generateAndSave({ input: bastTemplate, automataName: 'Inject', lang: ModuleNames.JavaScript, injects: functions.correctExportDefaultDict }, 'InjectCorrectExportDefaultDict');
		const dictionary = (await import(`./fixtures/generated/InjectCorrectExportDefaultDict_generated.js`)).functionDictionary;

		expect(dictionary?.get('isBoolean')).toBeDefined();
	});

	it('should correctly execute injected functions during state machine transitions', async () => {
		const input = `stateDiagram-v2
			[*] --> Initial: start
			Initial --> Processing: process
			Processing --> Success: succeed
			Processing --> Failure: fail
			
			note right of [*]
				inject/validateInput
				inject/processData
			end note
			
			note right of Initial
				#{result} <= validateInput($data)
			end note
			
			note right of Processing
				#{processed} <= processData($input)
			end note
		`;

		await generateAndSave({
			input,
			automataName: 'InjectFunctionCall',
			lang: ModuleNames.JavaScript,
			injects: functions.correct,
		}, 'InjectFunctionCall');

		const res = await import(`./fixtures/generated/InjectFunctionCall_generated.js`);

		expect(res.functionDictionary.get('validateInput')).toBeDefined();
		expect(res.functionDictionary.get('processData')).toBeDefined();

		const automata = new res.InjectFunctionCall();

		automata.dispatch({ action: res.actionsDictionary.start, payload: { data: true } });
		expect(automata.state).toBe(res.statesDictionary.Initial);
		expect(automata.context.result).toBeTruthy();

		automata.dispatch({ action: res.actionsDictionary.process, payload: { input: { value: 42 } } });
		expect(automata.state).toBe(res.statesDictionary.Processing);
		expect(automata.context.processed).toBeDefined();

		automata.dispatch({ action: res.actionsDictionary.succeed, payload: {} });
		expect(automata.state).toBe(res.statesDictionary.Success);
	});

	it('should successfully inject default exported function', async () => {
		const input = `stateDiagram-v2
		[*] --> A: toA
    note right of [*]
			inject/testDefault
		end note
		`;

		await generateAndSave({ input, automataName: 'Inject', lang: ModuleNames.JavaScript, injects: functions.correct }, 'InjectDefaultFunction');
		const dictionary = (await import(`./fixtures/generated/InjectDefaultFunction_generated.js`)).functionDictionary;

		await expect(dictionary?.get('testDefault')).toBeDefined();
	});

	it('should validate exported function types and reject invalid exports', async () => {
		const input = `stateDiagram-v2
		[*] --> A: toA
    note right of [*]
			inject/testDefault
		end note
		`;

		await generateAndSave({ input, automataName: 'Inject', lang: ModuleNames.JavaScript, injects: functions.badExportDefaultDict }, 'injectBadFunctionDict');
		const injectDictWithBadValues = async () => (await import(`./fixtures/generated/injectBadFunctionDict_generated.js`));

		await generateAndSave({ input, automataName: 'Inject', lang: ModuleNames.JavaScript, injects: functions.badDefaultFunctionExport }, 'injectBadFunction');
		const injectDefaultFunctionWithoutName = async () => (await import(`./fixtures/generated/injectBadFunction_generated.js`));

		await generateAndSave({ input, automataName: 'Inject', lang: ModuleNames.JavaScript, injects: functions.exportDefaultArray }, 'injectDefaultExportArray');
		const injectDefaultExportBadType = async () => (await import(`./fixtures/generated/injectDefaultExportArray_generated.js`));

		await generateAndSave({ input, automataName: 'Inject', lang: ModuleNames.JavaScript, injects: functions.exportArray }, 'InjectBadTypeDefault');
		const injectExportBadType = async () => (await import(`./fixtures/generated/InjectBadTypeDefault_generated.js`));

		await expect(injectDefaultFunctionWithoutName).rejects.toThrowError();
		await expect(injectDefaultExportBadType).rejects.toThrowError();
		await expect(injectExportBadType).rejects.toThrowError();
		await expect(injectDictWithBadValues).rejects.toThrowError();
	});

	it('should reject function names that conflict with built-in identifiers', async () => {
		const input = `stateDiagram-v2
		[*] --> A: toA
    note right of [*]
			inject/has
		end note
		`;

		const call = async () => await generateAndSave({ input, automataName: 'InjectInvalid', lang: ModuleNames.JavaScript, injects: functions.invalidInjectFunctions }, 'InjectInvalid');
		await expect(call).rejects.toThrowError();
	});

	it('should throw error when inject directive is used without function path', async () => {
		const call = async () => await generateAndSave({
			input: bastTemplate,
			automataName: 'InjectMissingPath',
			lang: ModuleNames.JavaScript,
		}, 'InjectMissingPath');

		await expect(call).rejects.toThrowError();
	});
	it('should throw error when referenced inject function does not exist', async () => {
		const input = `stateDiagram-v2
			[*] --> A: toA
			note right of [*]
				inject/nonExistentFunction
			end note
		`;

		await generateAndSave({
			input,
			automataName: 'InjectMissingFunction',
			lang: ModuleNames.JavaScript,
			injects: functions.correct,
		}, 'InjectMissingFunction');

		const importAutomata = async () => await import(`./fixtures/generated/InjectMissingFunction_generated.js`);

		await expect(importAutomata).rejects.toThrowError();
	});
});
