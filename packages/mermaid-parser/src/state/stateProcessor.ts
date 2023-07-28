import { parseStateDiagram } from "./stateParser.js";
import * as TBaseTypes from "./types/index.js"
import {
    TProcStates,
    TProcActions,
    TProcTransitions,
    TStateProcessor,
} from "./types/stateProcessorTypes.js"


/**
 * @brief This function creates a dictionary of transitions action;
 * @param stateDiagramStructure - base state diagram;
 * @returns Returns a dictionary of transitions action.
 */
function getTransitions(
    stateDiagramStructure: TBaseTypes.TStateDiagramStructure): TProcTransitions {

    const transitions: TProcTransitions = {}

    const stateDiagramActions = stateDiagramStructure.actions
    for (let i = 0; i < stateDiagramActions.length; i++) {
		const pairOfElements = stateDiagramActions[i];
		const from = pairOfElements.from;
		const to = pairOfElements.to;
		const action = pairOfElements.id;

		if (!Object.keys(transitions).includes(from)) {
			transitions[from] = {};
		}
		if (!Object.keys(transitions[from]).includes(to)) {
            const ProcAction: TProcActions = {
                id: [action],
                notes: []
            }
			transitions[from][to] = ProcAction
		}
		else {
			transitions[from][to].id.push(action)
		}
	}

    return transitions
}


/**
 * @brief A function that complements the action links with descriptions from the "fork elements";
 * @param parsedDiagram - a primary diagram dictionary;
 * @param transitions - array of transitions;
 * @param stateGraph - main dictionary with information from the diagram;
 * @returns Returns updated "stateGraph".
 */
function markChoices(
	stateDiagramStructure: TBaseTypes.TStateDiagramStructure,
    transitions: TProcTransitions
): TProcTransitions {
	const choices: TBaseTypes.TChoicesStructure = stateDiagramStructure.choices
	for (const choice of choices) {
		const toChoice: Record<string, TProcActions> = {}
		// find fromChoice
		const fromChoice: Record<string, TProcActions> = transitions[choice.id];
		delete transitions[choice.id];
		// find toChoice
		const actionKeys = Object.keys(transitions);
		for (let i = 0; i < actionKeys.length; i++) {
			const key: string = actionKeys[i];
			const value = transitions[key];
			if(Object.keys(value).includes(choice.id)) {
				toChoice[key] = value[choice.id];
				delete transitions[key][choice.id];
			}	
		}
		const toChoiceKeys = Object.keys(toChoice);
		for	(let i = 0; i < toChoiceKeys.length; i++) {
			const from = toChoiceKeys[i];
			const fromChoiceKeys = Object.keys(fromChoice);
			for (let j = 0; j < fromChoiceKeys.length; j++) {
				const to = fromChoiceKeys[j];
				const fromValue: TProcActions = toChoice[from];
				const toValue: TProcActions = fromChoice[to];
				for (const fromValueI of fromValue.id) {
					for (const toValueI of toValue.id) {
						const value = (fromValueI+" "+ toValueI).trim();
						
						if (!Object.keys(transitions[from]).includes(to)) {
							transitions[from][to] = {
								id: [value],
								notes: []
							};
						}
						else {
							transitions[from][to].id.push(value);
						}
					}
				}
			}
		}
	}

	return transitions;
}


export async function stateProcessor(
    diagramText: string): Promise<TStateProcessor> {
    const stateDiagramStructure: TBaseTypes.TStateDiagramStructure = 
    await parseStateDiagram(diagramText);

    let processor_transitions: TProcTransitions = 
    getTransitions(stateDiagramStructure);

    processor_transitions = 
    markChoices(stateDiagramStructure, processor_transitions);

    const stateProcessor: TStateProcessor = {
        transitions: processor_transitions,
        states: []
    }
	return stateProcessor;
}