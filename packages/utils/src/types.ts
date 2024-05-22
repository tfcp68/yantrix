export type TLengthArray<T, N extends number, R extends T[] = []> = number extends N
	? T[]
	: R['length'] extends N
		? R
		: TLengthArray<T, N, [T, ...R]>;
