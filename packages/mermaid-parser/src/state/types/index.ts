/**
 * Dict type that is responsible for collecting parsed diagram. Parser from mermaid library;
 */
export type TStringDict = Record<string, string | Record<string, string>>

/**
 * Array type that is responsible for collecting parsed diafram elements;
 */
export type TParsedDiagramArray =  TStringDict[]

/**
 * Array type that is responsible for collecting states;
 */
export type TDiagramStatesArray = string[]

/**
 * Array type that is responsible for collecting transitions;
 */
export type TTransitionsArray = string[][]

/**
 * Dict type that is responsible for collecting transitions action;
 */
export type TActionDict = Record<string, Record<string, null | string[]>>

/**
 * Dict type that is responsible for collecting notes;
 */
export type TNoteDict = Record<string, null | string[]>

/**
 * Dict type that is responsible for collecting actions, notes, states and transitions without action;
 */
export type TStateMermaidGraphDict = {
    actions: TActionDict
    notes: TNoteDict
    states: TDiagramStatesArray
    susTransitions: TTransitionsArray;
}

/**
 * Array type that is responsible for collecting choices;
 */
export type TChoices = string[]