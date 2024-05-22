export type TActionPath = {
	action: string[];
	note: string[][];
};

export type TActionPathArray = TActionPath[];

export type TDiagramState = {
	id: string;
	caption: string;
	notes: string[][];
	actionsPath: TActionPathArray;
	subtree?: TStateDiagram;
};

export type TDiagramStatesArray = TDiagramState[];

export type TDiagramAction = {
	actionsPath: TActionPathArray;
};

export type TDiagramTransitions = Record<string, Record<string, TDiagramAction>>;

export type TStateDiagram = {
	states: TDiagramStatesArray;
	transitions: TDiagramTransitions;
};

export type TFromChoice = {
	choice: string;
	from: string;
	actionsPath: TActionPathArray;
};

export type TFromChoiceArray = TFromChoice[];
export type TNotesId = Record<string, string[][]>;
export type TChoicesId = string[];
