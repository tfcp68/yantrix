import { TKeyItems } from './keyItem.js';

export type TAction = TKeyItems<'reducer'>;
export type TMeta = TKeyItems<'reducer'>;

export type TSubscribeStatement = {
	identifier: string;
	actionName: string;
};

export type TSubscribeWithPayload = {
	payload: TKeyItems<'reducer'>;
} & TSubscribeStatement;

export type TSubscribeWithMeta = TSubscribeWithPayload & {
	meta: TMeta;
};

export type TSubscribe = TSubscribeWithMeta | TSubscribeWithPayload | TSubscribeStatement;

export type TContext<T extends TKeyItems = TKeyItems> = {
	context: T;
};

export type TEventEmitStatement = {
	identifier: string;
};

export type TEmitWithMeta = TEventEmitStatement & TMeta;
export type TEmitFull = TEventEmitStatement & TMeta & TContext;
export type TEvenEmit = TEmitWithMeta | TEmitFull | TEventEmitStatement;
export type TEvents = { emit: TEvenEmit[] };

export type TContextDescription = {
	contextDescription: Array<{
		context: TKeyItems;
		reducer?: TKeyItems<'reducer'>;
	}>;
};

export type TInitialState = {
	initialState: boolean;
};

export type TByPass = {
	byPass: boolean;
};

export type TNotes = TInitialState & TContextDescription & TSubscribe & TEvents & TByPass;
