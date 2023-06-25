export type TNotesDict = Record<string, null | string[]>
export type TActorsArray = string[]
export type TMessagesDict = Record<string, Record<string, null | string[]>>

type TParsedMessagesDict = {
    from: string,
    message: string,
    to: string,
    type: number,
    wrap: boolean
}

type TParsedOtherElementsDict = {
    from: string | undefined,
    message: string | undefined,
    to: string | undefined,
    type: number,
    wrap: boolean
}

export type TParsedMessagesArray = TParsedMessagesDict[]
export type TParsedNotesArray = TParsedMessagesDict[]
export type TParsedOtherElementsArray = TParsedOtherElementsDict[]
export type TActivateDict = Record<string, string[][]>

export type TParsedDiagramTuple = [TParsedMessagesArray, TActorsArray, TParsedNotesArray, TParsedOtherElementsArray, TActivateDict]


export type TSequenceMermaidGraphDict = {
    messages: TMessagesDict
    notes: TNotesDict
    actors: TActorsArray
    activate: TActivateDict
}

export enum TSeqTypes{
    Note =  2,
    Activate = 17,
    Deactivate = 18
}