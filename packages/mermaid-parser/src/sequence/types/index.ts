/**
 * Dict type that is responsible for collecting notes;
 */
export type TNotesDict = Record<string, null | string[]>

/**
 * Array type that is responsible for collecting actors;
 */
export type TActorsArray = string[]

/**
 * Dict type that is responsible for collecting messages;
 */
export type TMessagesDict = Record<string, Record<string, null | string[]>>


/**
 * Dict type that is responsible for collecting parsed messages;
 */
type TParsedMessagesDict = {
    from: string,
    message: string,
    to: string,
    type: number,
    wrap: boolean
}

/**
 * Dict type that is responsible for collecting parsed other elements (other, then messages and notes);
 */
type TParsedOtherElementsDict = {
    from: string | undefined,
    message: string | undefined,
    to: string | undefined,
    type: number,
    wrap: boolean
}

/**
 * Array type that is responsible for collecting dictionaries of parsed messages;
 */
export type TParsedMessagesArray = TParsedMessagesDict[]

/**
 * Array type that is responsible for collecting dictionaries of parsed notes;
 */
export type TParsedNotesArray = TParsedMessagesDict[]

/**
 * Array type that is responsible for collecting dictionaries of parsed other elements;
 */
export type TParsedOtherElementsArray = TParsedOtherElementsDict[]

/**
 * Dict type that is responsible for collecting messages that are located in the activation interval;
 */
export type TActivateDict = Record<string, string[][]>

/**
 * Tuple type that is responsible for collecting parsed messages, actors, notes, other elements
 * and activated messages. Parser from mermaid library;
 */
export type TParsedDiagramTuple = [
    TParsedMessagesArray,
    TActorsArray,
    TParsedNotesArray,
    TParsedOtherElementsArray,
    TActivateDict
]

/**
 * Dict type that is responsible for collecting messages, actors, notes and activated messages;
 */
export type TSequenceMermaidGraphDict = {
    messages: TMessagesDict
    notes: TNotesDict
    actors: TActorsArray
    activate: TActivateDict
}

/**
 * Enumeration with types from the parser
 */
export enum TSeqTypes{
    Note =  2,
    Activate = 17,
    Deactivate = 18
}

/**
 * Enumeration with arrow types from the parser
 */
export const arrowTypes = [0, 1, 3, 4, 5, 6, 24, 25];