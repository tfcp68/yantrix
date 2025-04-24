import { TExpressionDefineMap, TExpressionMap, TInjectIdent } from './expressions.js';
import { TKeyItems } from './keyItem.js';

export type TAction = TKeyItems<'reducer'>;
export type TMeta = TKeyItems<'reducer'>;

export type TDefine = {
	identifier: string;
	Arguments: string[];
	expression: TExpressionDefineMap;
};

export type TDefines = { defines: TDefine[] };

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

export type TEventSubscribe = TSubscribeWithMeta | TSubscribeWithPayload | TSubscribeStatement;
export type TSubscribes = { subscribe: TEventSubscribe[] };

export type TContext<T extends TKeyItems = TKeyItems> = {
	context: T;
};

export type TEventEmitStatement = {
	identifier: string;
};

export type TEmitWithMeta = TEventEmitStatement & {
	meta: TMeta;
};
export type TEmitFull = TEmitWithMeta & { context: TKeyItems<'reducer'> };
export type TEventEmit = TEmitWithMeta | TEmitFull | TEventEmitStatement;
export type TEmits = { emit: TEventEmit[] };

export type TContextShort = {
	context: TKeyItems;
};

export type TContextReducer = {
	reducer: TKeyItems<'reducer'>;
} & TContextShort;

export type TContextItem = TContextShort | TContextReducer;

export type TContextDescription = {
	contextDescription: TContextItem[];
};

export type TInitialState = {
	initialState: boolean;
};

export type TExpressionStatement = {
	expression?: TExpressionMap;
};

export type TByPass = {
	byPass: boolean;
};

export type TInject = {
	inject: TInjectIdent[];
};

export type TNotes = TInitialState & TContextDescription & TSubscribes & TEmits & TByPass & TDefines & TInject & TExpressionStatement;
