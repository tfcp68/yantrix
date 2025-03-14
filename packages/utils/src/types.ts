export type TLengthArray<T, N extends number, R extends T[] = []> = number extends N
	? T[]
	: R['length'] extends N
		? R
		: TLengthArray<T, N, [T, ...R]>;

export type TStaticMethods = {
	id: string;
	actions: Record<string, string>;
	states: Record<string, string>;
	getState: (state: any) => number;
	hasState: (instance: any, state: any) => boolean;
	getAction: (action: any) => number;
	createAction: (action: any, payload: any) => {
		action: number;
		payload: any;
	};
};

export type TClassConstructor<C> = {
	new (...args: any[]): C;
};

export type TKeys<T> = keyof T;
export type TNullable<T> = T | null;
