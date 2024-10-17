import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import templates from './fixtures/eventsTemplates';
import { generateAndSave } from './fixtures/utils';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const getGeneratedFixturePath = (name: string) => path.resolve(dirname, 'fixtures/generated', name);

describe('automata Events', () => {
	describe('event Adapter', () => {
		it('automata has an Event Adapter', async () => {
			await generateAndSave({ input: templates.defaultTemplate, automataName: 'EventAdapterAutomata', lang: 'JavaScript' }, `event_adapter`);
			const { EventAdapterAutomata } = await import(
				getGeneratedFixturePath('event_adapter_generated.js')
			);

			const automata = new EventAdapterAutomata();

			expect(automata.eventAdapter).toBeDefined();
		});
	});

	describe('event Bus', () => {
		it('multiple automatas share one Event Bus', async () => {
			// await generateAndSave({ input: templates.defaultTemplate, automataName: 'EventBusTest1', lang: 'JavaScript' }, `event_bus1`);
			// await generateAndSave({ input: templates.defaultTemplate, automataName: 'EventBusTest2', lang: 'JavaScript' }, `event_bus2`);
		});
	});
});
