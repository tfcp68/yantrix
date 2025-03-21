export type TActionPath = {
	action: string[];
	note: string[][];
};

/**
 * Represents the state diagram matrix.
 * Contains only the relevant information for the state diagram, other information from Mermaid structures is omitted.
 */
export type TStateDiagramMatrix = {
	states: TDiagramStatesArray;
	transitions: TDiagramTransitions;
} & TStateDiagramActionChains;

export type TStateDiagramActionChains = {
	actionChains: TDiagramActionChains;
};

export type TActionPathArray = TActionPath[];

/**
 * Represents the processed state information for the state diagram.
 */
export type TDiagramState = {
	id: string;
	caption: string;
	notes: string[][];
	actionsPath: TActionPathArray;
	subtree?: TStateDiagramMatrix;
};

/** Array of processed states from the diagram. */
export type TDiagramStatesArray = TDiagramState[];

/**
 * Represents the processed action information for the state diagram.
 */
export type TDiagramAction = {
	actionsPath: TActionPathArray;
};

/** Processed transitions between states of the diagram. */
export type TDiagramTransitions = Record<string, Record<string, TDiagramAction>>;

export type TActionChain = {
	chain: string[];
	state: string;
};

export type TActionChainParams = {
	chains: TActionChain[];
	params: string | null;
};

export type TDiagramActionChains = Record<string, Record<string, TActionChainParams>>;

export type TFromChoice = {
	choice: string;
	from: string;
	actionsPath: TActionPathArray;
};

export type TFromChoiceArray = TFromChoice[];
export type TNotesId = Record<string, string[][]>;
export type TChoicesId = string[];
