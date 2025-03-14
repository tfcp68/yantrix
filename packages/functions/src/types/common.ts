export type TNestedArray<T = unknown> = (T | TNestedArray<T>)[];
export type TCasePair<T> = [boolean, T];
export type TNullable<T> = T | null;
export type TCollection<K extends string | number | symbol = string, V = unknown> = Record<K, V>[];
