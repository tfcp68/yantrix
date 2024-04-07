import { TKeyItems } from './keyItem.js';

type TAction<T extends TKeyItems = TKeyItems> = {
	actionName: string;
} & (T extends undefined
	? {}
	: {
			payload: T;
		});

export type TSubscribeStatement<T extends TKeyItems = TKeyItems> = {
	event: string;
	action: TAction<T>;
};

export type TEventEmitStatement<T extends TKeyItems = TKeyItems> = {
	eventName: string;
} & (T extends undefined ? {} : { payload: T });

export type TContextStatement<
	T extends TKeyItems = TKeyItems,
	X extends TKeyItems = TKeyItems,
> = {
	context: T;
	payload: X;
};

export const isActionWithPayload = (
	action: TAction,
): action is TAction<TKeyItems> => {
	return Object.keys(action).includes('payload');
};

export const isSubscribeWithPayload = (
	subscribe: TSubscribeStatement,
): subscribe is TSubscribeStatement<TKeyItems> => {
	if (subscribe?.action) {
		const action = { subscribe };
		return Object.keys(action).includes('payload');
	}
	return false;
};
