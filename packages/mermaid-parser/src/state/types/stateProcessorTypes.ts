export type TProcState = {
	id: string;
	caption: string;
	notes: string[]; // построчно
	actions: string[]; // выходящие переходы (ссылки на стейты)
	subtree?: TStateProcessor;
};

export type TProcStatesArray = TProcState[];

export type TProcAction = {
	id: string[];
	notes: string[][];
};

export type TProcTransitions = Record<string, Record<string, TProcAction>>;

export type TStateProcessor = {
	states: TProcStatesArray;
	transitions: TProcTransitions;
};
