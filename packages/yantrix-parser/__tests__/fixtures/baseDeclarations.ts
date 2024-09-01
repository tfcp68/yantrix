import { TMapped } from '../../src/index.js';
import { TKeyItems } from '../../src/types/keyItem.js';
import { baseKeyItemDeclaration, createContextDescription } from './keyItem.js';

export const baseEmpty = {
	contextDescription: [],
	emit: [],
	subscribe: [],
};

export const baseContext = createContextDescription(
	[baseKeyItemDeclaration('LeftSideProperty')],
	[baseKeyItemDeclaration('RightSideProperty', 'context' as keyof TMapped)],
);

export const baseContextWithPrevious = createContextDescription(
	[baseKeyItemDeclaration('LeftSideProperty')],
	[baseKeyItemDeclaration('RightSideProperty', 'payload' as keyof TMapped)],
);

export function createSubscribeStatement(eventName: string = 'event',	actionName: string = 'action',	payloadItems: TKeyItems = [baseKeyItemDeclaration('m', 'context' as keyof TMapped)],	context: TKeyItems = [baseKeyItemDeclaration('k', 'context' as keyof TMapped)]) {
	return {
		subscribe: [
			{
				identifier: eventName,
				actionName,
				meta: [...context],
				payload: [...payloadItems],
			},
		],
	};
}

export function createEmitStatement(eventName: string = 'event',	payloadItems: TKeyItems = [baseKeyItemDeclaration('t', 'context' as keyof TMapped)],	context: TKeyItems = [baseKeyItemDeclaration('ab')]) {
	return {
		emit: [
			{
				identifier: eventName,
				meta: [...payloadItems],
				context: [...context],
			},
		],
	};
}

export const baseSubscribe = createSubscribeStatement();
export const baseEmitEvent = createEmitStatement();
