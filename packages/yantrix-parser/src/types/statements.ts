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
export type TSubscribe = {
	subscribe: TSubscribeStatement[];
};
export type TEventEmitStatement<T extends TKeyItems = TKeyItems> = {
	eventName: string;
} & (T extends undefined ? {} : { payload: T });

export type TEvents = { emit: TEventEmitStatement[] };

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
	contextDescription: [TPayloadToContext | TPreviousToContext | TContext];
};

export type TInitialState = {
	initialState: boolean;
};

export type TNotes = TInitialState & TContextDescription & TSubscribe & TEvents;
