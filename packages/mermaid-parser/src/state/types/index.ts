/**
 * Dict type for mermaid parsed diagram. Parser from mermaid library;
 * https://github.com/mermaid-js/mermaid/tree/develop/packages/mermaid/src/diagrams/state
 */
export type TStringDict = Record<string, string | Record<string, string>>

//Array type for mermaid parsed diafram elements;
export type TParsedDiagramArray =  TStringDict[]

/**
 * Array type for states;
 * https://mermaid.js.org/syntax/stateDiagram.html#states
 */
export type TDiagramStatesArray = string[]

/**
 * Array type for transitions;
 * https://mermaid.js.org/syntax/stateDiagram.html#transitions
 */
export type TTransitionsArray = string[][]

type TAnonymousTransitionsDict = {
	from: string,
	to: string
}

// Array type for anonymous transitions;
export type TAnonymousTransitionsArray = TAnonymousTransitionsDict[]

//Dict type for transitions action;
export type TAction = {
	note: string[],
	transition: []
}
export type TActionDict = Record<string, Record<string, TAction>>

/**
 * Dict type for notes;
 * https://mermaid.js.org/syntax/stateDiagram.html#notes
 */
export type TNoteDict = Record<string, string[]>

/**
 * Array type for choices;
 * https://mermaid.js.org/syntax/stateDiagram.html#choice
 */
export type TChoices = string[]

//Dict type for actions, notes, states and transitions without action;
export type TStateGraph = {
    actions: TActionDict,
    notes: TNoteDict,
    states: TDiagramStatesArray,
    anonymousTransitions: TAnonymousTransitionsArray
}



type TStateDiagram = {
	actions: TActionDict,
	notes: {
		state: string[]
	},
	states: string[],
	anonymousTransitions: {
		from: string,
		to: string
	}
}