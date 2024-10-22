import { BasicActionDictionary, BasicEventDictionary, BasicStateDictionary } from '@yantrix/automata';
import { ExpressionTypes, isEmitFull, isEmitWithMeta, isSubscribeWithMeta, isSubscribeWithPayload } from '@yantrix/yantrix-parser';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';
import { context } from '../context';

function getRegisterGlobalEventsCode() {
	return `GlobalEventDictionary.addEvents({ keys: Object.keys(eventDictionary).filter(e => GlobalEventDictionary.getEventValues({ keys: [e] })[0] == null) })`;
}

function getEmittedEvents(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	eventDictionary: BasicEventDictionary;
	expressions: TExpressionRecord;
}) {
	const lines: string[] = [];
	for (const state of props.diagram.states) {
		const stateId = props.stateDictionary.getStateValues({ keys: [state.id] })[0];
		const emittedEvents = state.notes?.emit;
		if (emittedEvents && emittedEvents.length > 0) {
			lines.push(`
                this.eventAdapter.addEventEmitter(${stateId}, ({ state, context }) => {
                    const eventsToEmit = [
                        ${emittedEvents
								.map((e) => {
									if (isEmitFull(e)) {
										e.context = e.context.map(c => ({
											keyItem: {
												...c.keyItem,
												expressionType: ExpressionTypes.Context,
											},
										}));
									}
									return `
                                {
                                    event: ${props.eventDictionary.getEventValues({ keys: [e.identifier] })[0]},
                                    meta: {
                                        ${isEmitFull(e)
												? context.serializer.getBoundValues({
													expressions: props.expressions,
													arr: context.serializer.mapReducerItems({ reducer: e.context, sourcePath: 'context', expressions: props.expressions }),
													context: e.meta,
												})
												: (isEmitWithMeta(e)
														? context.serializer.getBoundValues({
															expressions: props.expressions,
															arr: context.serializer.mapReducerItems({ reducer: e.meta, sourcePath: 'context', expressions: props.expressions }),
															context: e.meta,
														})
														: '')
										}
                                    }
                                }
                            `;
								})
								.join(',\n')}
                    ];
                    
                    this.eventBus.dispatch(...eventsToEmit);

                    return eventsToEmit[0];
                });
            `);
		}
	}
	if (lines.length > 0) lines.unshift('// add event emitters');
	return lines.join('\n');
}

function getSubscribedEvents(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	actionDictionary: BasicActionDictionary;
	eventDictionary: BasicEventDictionary;
	expressions: TExpressionRecord;
}) {
	const eventSubscribes: string[] = [];
	const eventBusSubscribes: string[] = [];
	for (const state of props.diagram.states) {
		const eventsToSubscribe = state.notes?.subscribe;
		if (eventsToSubscribe && eventsToSubscribe.length > 0) {
			eventsToSubscribe.forEach((e) => {
				const eventId = props.eventDictionary.getEventValues({ keys: [e.identifier] })[0];
				const actionId = props.actionDictionary.getActionValues({ keys: [e.actionName] })[0];

				eventSubscribes.push(`
                    this.eventAdapter.addEventListener(${eventId}, ({ event, meta }) => {

                        return {
                            action: ${actionId},
                            payload: {
                                ${isSubscribeWithMeta(e)
										? context.serializer.getBoundValues({
											expressions: props.expressions,
											arr: context.serializer.mapReducerItems({ reducer: e.meta, sourcePath: 'meta', expressions: props.expressions }),
											context: e.payload,
										})
										: (
												isSubscribeWithPayload(e)
													? context.serializer.getBoundValues({
														expressions: props.expressions,
														arr: context.serializer.mapReducerItems({ reducer: e.payload, sourcePath: 'meta', expressions: props.expressions }),
														context: e.payload,
													})
													: ''
											)
								}
                            }
                        }
                    })
                `);

				eventBusSubscribes.push(`
                    this.eventBus.subscribe(${eventId}, ({ event, meta }) => {

                        // note: these seem to be all actions from all automatas subscribed to this event
                        const newActions = this.eventAdapter.handleEvent({ event, meta });
                        for(const action of newActions) {
                            this.dispatch(action);
                        }
                        return {
                            event,
                            meta,
                            task_id: 'event_id${eventId}',
                            result: this.eventBus.getEventStack()
                        }
                    })
                `);
			});
		}
	}
	const result = eventSubscribes.concat(eventBusSubscribes);
	if (result.length > 0) result.unshift('// add event listeners');
	return result.join('\n');
}

export const eventsSerializer = {
	getRegisterGlobalEventsCode,
	getEmittedEvents,
	getSubscribedEvents,
};
