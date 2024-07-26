import { TKeyItems } from '../../src/types/keyItem.js';
import { baseKeyItemDeclaration, createContextDescription } from './keyItem.js';

export const baseEmpty = {
	contextDescription: [],
	emit: [],
	subscribe: [],
};

export const baseContext = createContextDescription(
	[baseKeyItemDeclaration('LeftSideProperty')],
	[baseKeyItemDeclaration('RightSideProperty', 'context')],
);

export const baseContextWithPrevious = createContextDescription(
	[baseKeyItemDeclaration('LeftSideProperty')],
	[baseKeyItemDeclaration('RightSideProperty', 'payload')],
);

export const createSubscribeStatement = (
	eventName: string = 'event',
	actionName: string = 'action',
	payloadItems: TKeyItems = [baseKeyItemDeclaration('m', 'context')],
	context: TKeyItems = [baseKeyItemDeclaration('k', 'context')],
) => ({
	subscribe: [
		{
			identifier: eventName,
			actionName,
			meta: [...context],
			payload: [...payloadItems],
		},
	],
});

export const createEmitStatement = (
	eventName: string = 'event',
	payloadItems: TKeyItems = [baseKeyItemDeclaration('t', 'context')],
	context: TKeyItems = [baseKeyItemDeclaration('ab')],
) => ({
	emit: [
		{
			identifier: eventName,
			meta: [...payloadItems],
			context: [...context],
		},
	],
});

export const baseSubscribe = createSubscribeStatement();
export const baseEmitEvent = createEmitStatement();
