import { TKeyItems } from './keyItem.js';

export type TAction<T extends TKeyItems = TKeyItems> = {
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

export type TContextStatement<T extends TKeyItems = TKeyItems, X extends TKeyItems = TKeyItems> = {
	context: T;
	payload: X;
};
export type TPreviousContextToContext<T extends TKeyItems = TKeyItems> = {
	prevContext: T;
};

export type TContext<T extends TKeyItems = TKeyItems> = {
	context: T;
};
export type TPreviousToContext<T extends TKeyItems = TKeyItems> = {
	prevContext: T;
} & TContext;

export type TPayloadToContext<T extends TKeyItems = TKeyItems> = {
	payload: T;
} & TContext;

export type TContextDescription = {
	contextDescription: [TPayloadToContext, TPreviousToContext];
};

export type TNotes = TContextDescription;
