export type stringDict = Record<string, string | Record<string, string>>

export type parsedDiagramArray =  stringDict[]

export type diagramStatesArray = string[]

export type transitionsArray = string[][]

export type actionDict = Record<string, Record<string, null | string[]>>

export type noteDict = Record<string, null | string[]>

export type stateMermaidGraphDict = {
    actions: actionDict
    notes: noteDict
    states: diagramStatesArray
    susTransitions: transitionsArray;
}