import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ModuleNames } from '@yantrix/codegen';
import { CoreLoop, EffectScheduler, EventDictionary, ModelStore } from '@yantrix/core';
import { expect, it } from 'vitest';
import { generateAndSave } from './fixtures/utils';

const generated = fileURLToPath(new URL('./fixtures/generated', import.meta.url));

it.each([
	[ModuleNames.JavaScript, 'js'],
	[ModuleNames.TypeScript, 'ts'],
] as const)('routes colliding and shared Event names across separately generated slices in %s', async (lang, ext) => {
	async function generateSlice(event: string) {
		const className = `Flow${event}`;
		const fixture = `routing_${event}_${ext}`;
		const input = `stateDiagram-v2
			[*] --> Idle: Init
			Idle --> Applied: APPLY
			note right of Idle
				+Init
				subscribe/start${event} APPLY
			end note
			note right of Applied
				effect/${event}
				effect/routeShared
			end note`;
		await generateAndSave({ input, automataName: className, lang }, fixture);
		return import(path.join(generated, `${fixture}_generated.${ext}`));
	}

	// Aa and BB have the same initial hash. The shared name must still reach both slices.
	const first = await generateSlice('Aa');
	const second = await generateSlice('BB');
	expect(first.eventDictionary.Aa).not.toBe(second.eventDictionary.BB);
	expect([first.eventDictionary.Aa, second.eventDictionary.BB])
		.toEqual(EventDictionary.getEventValues({ keys: ['Aa', 'BB'] }));
	expect(first.eventDictionary.routeShared).toBe(second.eventDictionary.routeShared);

	const initial = { left: 0, right: 0, sharedLeft: 0, sharedRight: 0 };
	const store = new ModelStore(initial);
	const loop = new CoreLoop({ effectScheduler: new EffectScheduler({ store }) });
	const increment = (field: keyof typeof initial) => (_event: unknown, model: typeof initial) =>
		({ ...model, [field]: model[field] + 1 });
	loop.registerSlice(first.createFlowAaSlice({ Aa: increment('left'), routeShared: increment('sharedLeft') }));
	loop.registerSlice(second.createFlowBBSlice({ BB: increment('right'), routeShared: increment('sharedRight') }));
	try {
		loop.getBus().dispatch({ event: first.eventDictionary.startAa, meta: null });
		await loop.whenIdle();
		expect(store.get()).toEqual({ left: 1, right: 0, sharedLeft: 1, sharedRight: 1 });
		loop.getBus().dispatch({ event: second.eventDictionary.startBB, meta: null });
		await loop.whenIdle();
		expect(store.get()).toEqual({ left: 1, right: 1, sharedLeft: 2, sharedRight: 2 });
	} finally {
		loop.stop();
	}
});
