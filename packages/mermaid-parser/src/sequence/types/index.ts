/**
 * Dict type for notes;
 * https://mermaid.js.org/syntax/sequenceDiagram.html#notes
 */
export type TNotesDict = Record<string, null | string[]>

/**
 * Array type for actors;
 * https://mermaid.js.org/syntax/sequenceDiagram.html#actors
 */
export type TActorsArray = string[]

/**
 * Dict type for messages;
 * https://mermaid.js.org/syntax/sequenceDiagram.html#messages
 */
export type TMessagesDict = Record<string, Record<string, null | string[]>>

/**
 * Dict type for messages that are located in the activation interval;
 * https://mermaid.js.org/syntax/sequenceDiagram.html#activations
 */
export type TActivationsDict = Record<string, string[][]>

/**
 * Dict type for mermaid parsed messages. Parser from mermaid library;
 * https://github.com/mermaid-js/mermaid/tree/develop/packages/mermaid/src/diagrams/sequence
 */
type TParsedMessagesDict = {
    from: string,
    message: string,
    to: string,
    type: number,
    wrap: boolean
}

/**
 * Dict type for mermaid parsed other elements (other, then messages and notes). Parser from mermaid library;
 * https://github.com/mermaid-js/mermaid/tree/develop/packages/mermaid/src/diagrams/sequence
 */
type TParsedOtherElementsDict = {
    from: string | undefined,
    message: string | undefined,
    to: string | undefined,
    type: number,
    wrap: boolean
}

//Array type that is responsible for collecting dictionaries of parsed messages;
export type TParsedMessagesArray = TParsedMessagesDict[]

//Array type for dictionaries of parsed notes;
export type TParsedNotesArray = TParsedMessagesDict[]

//Array type for dictionaries of parsed other elements;
export type TParsedOtherElementsArray = TParsedOtherElementsDict[]

/**
 * Dict type that is responsible for collecting parsed messages, actors, notes, other elements
 * and activated messages. Parser from mermaid library;
 */
export type TParsedDiagramDict = {
    messages: TParsedMessagesArray,
    actors: TActorsArray,
    notes: TParsedNotesArray,
    others: TParsedOtherElementsArray,
    activations: TActivationsDict
}

//Dict type for messages, actors, notes and activated messages;
export type TSequenceMermaidGraphDict = {
    messages: TMessagesDict
    notes: TNotesDict
    actors: TActorsArray
    activations: TActivationsDict
}

//Enumeration with types from the mermaid parser;
export enum TSeqTypes{
    Note =  2,
    Activate = 17,
    Deactivate = 18
}

//Enumeration with arrow types from the mermaid parser;
export const arrowTypes = [0, 1, 3, 4, 5, 6, 24, 25];