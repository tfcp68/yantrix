export type notesDict = Record<string, null | string[]>
export type actorsArray = string[]
export type messagesDict = Record<string, Record<string, null | string[]>>

type parsedMessagesDict = {
    from: string | Record<string, string> | undefined,
    message: string | undefined,
    to: string | undefined,
    type: number,
    wrap: boolean
}

export type parsedMessagesArray = parsedMessagesDict[]

export type parsedDiagramTuple = [parsedMessagesArray, actorsArray]


export type sequenceMermaidGraphDict = {
    messages: messagesDict
    notes: notesDict
    actors: actorsArray
    susDirections: string[][];
}