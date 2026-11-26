import { fileURLToPath } from 'node:url';
import { ModuleNames } from '@yantrix/codegen';
import ts from 'typescript';
import { expect, it } from 'vitest';
import { generateAndSave, saveFile } from './fixtures/utils';

it('accepts read-only model snapshots in both generated factories and checks the event key', async () => {
	const input = `stateDiagram-v2
		[*] --> Idle: Init
		Idle --> Saved: Save
		note right of Idle
			+Init
			effect/reset
		end note
		note right of Saved
			#{itemId = 7}
			effect/itemSaved <= (itemId)
		end note`;
	await generateAndSave({ input, automataName: 'SaveFlow', lang: ModuleNames.TypeScript }, 'effect_consumer_flow');
	saveFile('effect_consumer', `
		import { createModelFunctions } from '@yantrix/core';
		import {
			createSaveFlowEffectMatrix, createSaveFlowSlice, eventDictionary,
			type TSaveFlowEffectEvent, type TSaveFlowEventMeta,
		} from './effect_consumer_flow_generated.js';

		type TModel = { tags: string[] };
		const fx = createModelFunctions<TModel, TSaveFlowEffectEvent, TSaveFlowEventMeta>();
		const keepTags = fx.forEvent<typeof eventDictionary.itemSaved>().transformer(
			model => model.tags,
			(model, tags) => ({ ...model, tags }),
			(_event, tags) => tags,
		);
		createSaveFlowEffectMatrix<TModel>({ itemSaved: keepTags, reset: (_event, model) => model });
		createSaveFlowSlice<TModel>({ itemSaved: keepTags, reset: (_event, model) => model });
		// @ts-expect-error The itemSaved transformer is bound to its own event key.
		createSaveFlowSlice<TModel>({ itemSaved: keepTags, reset: keepTags });
	`, 'ts');
	const consumer = fileURLToPath(new URL('./fixtures/generated/effect_consumer_generated.ts', import.meta.url));
	const program = ts.createProgram([consumer], {
		module: ts.ModuleKind.NodeNext,
		target: ts.ScriptTarget.ES2022,
		strict: true,
		noUncheckedIndexedAccess: true,
		skipLibCheck: true,
		noEmit: true,
	});
	expect(ts.getPreEmitDiagnostics(program).map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n'))).toEqual([]);
}, 20000);
