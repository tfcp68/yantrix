export type stringDict = Record<string, string | Record<string, string>>

export type parsedDiagramArray =  stringDict[]

export type diagramElementsArray = string[]

export type directionsArray = string[][]

export type actionDict = Record<string, Record<string, null | string[]>>

export type noteDict = Record<string, null | string[]>

export type mermaidGraphDict = {
    actions: actionDict
    notes: noteDict
    states: diagramElementsArray
    susDirections: directionsArray;
}