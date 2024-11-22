import { BasicActionDictionary, BasicEventDictionary, BasicStateDictionary } from '@yantrix/automata';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';
import { getEventEmitters, getEventListeners } from './core';

function getEventAdapterCode(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	eventDictionary: BasicEventDictionary;
	expressions: TExpressionRecord;
}) {
	const lines: string[] = [];
	lines.push('const eventAdapter = new AutomataEventAdapter();');
	lines.push(getEventEmitters(props));
	lines.push(getEventListeners(props));
	return lines.join('\n');
}

function getCreateEventBusFunctionCode() {
	const lines: string[] = [];
	lines.push('export function createEventBus(id, FSMs) {');
	lines.push('const EventBus = new BasicEventBus();');
	lines.push('EventBus.correlationId = id;');
	lines.push(`const automatas = ${getEventBusAutomatasCode()}`);
	lines.push(getEventBusSubscriptions());
	lines.push('return [EventBus, automatas];');
	lines.push('}');
	return lines.join('\n');
}

function getEventBusAutomatasCode() {
	return `Object.fromEntries(
		Object.entries(FSMs).map(([automataId, AutomataClass]) => {
			return [automataId, new AutomataClass()]
		})
	);`;
}

function getEventBusSubscriptions() {
	return `Object.entries(GlobalEventDictionary.getDictionary())
	.forEach(([eventName, eventId]) => {
	
		EventBus.subscribe(eventId, ({ event, meta }) => {

			const nextEventsToProcess = [];

			Object.values(automatas).forEach(automata => {
				const newActions = automata.eventAdapter?.handleEvent({ event, meta }) ?? [];
				for (const action of newActions) {
					automata.dispatch(action);
					const newAutomataEvents = automata.eventAdapter?.handleTransition(automata.getContext()) ?? [];
					nextEventsToProcess.push(...newAutomataEvents);
				}
			})

			EventBus.dispatch(...nextEventsToProcess);
	
			return {
				event,
				meta,
				task_id: \`event_\${eventName}_\${eventId}\`,
				result: new Promise((resolve, reject) => {
					try {
						const eventStack = EventBus.getEventStack();
						resolve(eventStack);
					} catch {
						reject(new Error('Error getting event stack'))
					}
				})
			}
		})

	});`;
}

export const eventsSerializer = {
	getEventAdapterCode,
	getCreateEventBusFunctionCode,
};
