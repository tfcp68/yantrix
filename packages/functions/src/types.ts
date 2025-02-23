export type TNestedArray<T> = (T | TNestedArray<T>)[];
export type TCasePair<T> = [boolean, T];
