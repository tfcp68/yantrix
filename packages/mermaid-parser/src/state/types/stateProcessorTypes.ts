export type TProcStates = {
    caption: string,
    notes: string[], // построчно
    actions: string[], // выходящие переходы
    subtree?: TStateProcessor
}

export type TProcStatesArray = TProcStates[]

export type TProcActions = {
    id: string[],
    notes: string[][]
}

export type TProcTransitions = Record<string, Record<string, TProcActions>>


export type TStateProcessor = {
    states: TProcStatesArray,
    transitions: TProcTransitions
}