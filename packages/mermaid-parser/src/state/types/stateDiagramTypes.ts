export type TDiagramState = {
	id: string;
	caption: string;
	notes: string[][];
	actions: string[][]; // выходящие переходы (ссылки на стейты)
	subtree?: TStateDiagram;
};

export type TDiagramStatesArray = TDiagramState[];

export type TDiagramAction = {
	id: string[][];
	notes: string[][];
};

export type TDiagramTransitions = Record<
	string,
	Record<string, TDiagramAction>
>;

export type TStateDiagram = {
	states: TDiagramStatesArray;
	transitions: TDiagramTransitions;
};

export type TFromChoice = {
	choice: string;
	from: string;
	action: string[][];
	note: string[][];
};
