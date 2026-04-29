export type TDictionaries = string[];

export type TActionToStateEntryModel = {
	state: number[];
	withPredicate: boolean;
};

export type TActionToStateFromStateModel = Record<number, Record<number, TActionToStateEntryModel>>;
