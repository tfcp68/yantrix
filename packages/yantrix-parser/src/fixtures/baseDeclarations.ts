import { baseKeyItemDeclaration, createKeyItemDeclaration, createContextDescription } from './keyItem.js';
import { TKeyItems } from '../types/keyItem.js';

export const baseEmpty = {
	contextDescription: [],
	emit: [],
	subscribe: [],
};

export const baseContext = createContextDescription(
	[baseKeyItemDeclaration('LeftSideProperty')],
	[baseKeyItemDeclaration('RightSideProperty')],
);

export const baseContextWithPrevious = createContextDescription(
	[baseKeyItemDeclaration('LeftSideProperty')],
	undefined,
	[baseKeyItemDeclaration('RightSideProperty')],
);

export const createSubscribeStatement = (eventName: string = 'event', actionName: string = 'action') => ({
	subscribe: [
		{
			event: eventName,
			action: {
				actionName: actionName,
			},
		},
	],
});

export const createEmitStatement = (
	eventName: string = 'event',
	payloadItems: TKeyItems = [baseKeyItemDeclaration('keylist')],
) => ({
	emit: [
		{
			eventName: eventName,
			payload: [...payloadItems],
		},
	],
});

export const baseSubscribe = createSubscribeStatement();
export const baseEmitEvent = createEmitStatement();
