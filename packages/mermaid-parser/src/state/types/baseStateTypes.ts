/**
 * Dict type for mermaid parsed diagram. Parser from mermaid library;
 * https://github.com/mermaid-js/mermaid/tree/develop/packages/mermaid/src/diagrams/state
 */
export type TParsedStringDict = Record<string, string | Record<string, string>>;

// Array type for mermaid parsed diagram elements;
export type TParsedDiagramArray = TParsedStringDict[];

/**
 * Array type for transitions;
 * https://mermaid.js.org/syntax/stateDiagram.html#transitions
 */
export type TTransitionsArray = string[][];

export type TState = {
	id: string;
	caption: string; // === `name` если не указано
	subtree?: TStateDiagramStructure;
};

/**
 * Array type for states;
 * https://mermaid.js.org/syntax/stateDiagram.html#states
 */
export type TStatesStructure = TState[];

export type TChoice = {
	id: string;
};

/**
 * Array type for choices;
 * https://mermaid.js.org/syntax/stateDiagram.html#choice
 */
export type TChoicesStructure = TChoice[];

// Dict type for transitions action;
export type TAction = {
	id: string; // ""
	from: string;
	to: string;
};
export type TActionParams = {
	params: string | null;
	predicate: boolean;
	internal: boolean;
} | null;
export type TActionWithParams = TAction & TActionParams;

/**
 * Array type for transitions action;
 * https://mermaid.js.org/syntax/stateDiagram.html#transitions
 */
export type TActionsStructure = TAction[];

// Dict type for note;
export type TNote = {
	text: string[];
	over: string;
};
/**
 * Type for notes with Yantrix subsyntax written inside of them.
 * https://mermaid.js.org/syntax/stateDiagram.html#notes
 */
export type TNotesStructure = TNote[];

// Dict type for fork;
export type TFork = {
	id: string;
};

/**
 * Array type for forks;
 * https://mermaid.js.org/syntax/stateDiagram.html#forks
 */
export type TForksStructure = TFork[];

/**
 * Dictionary type for the structure of a state diagram.
 */
export type TStateDiagramStructure = {
	states: TStatesStructure;
	actions: TActionsStructure;
	notes: TNotesStructure;
	choices: TChoicesStructure;
	forks: TForksStructure;
};
