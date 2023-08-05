import { parseStateDiagram } from './stateParser.js';
import {
	TStateDiagramStructure,
	TTransitionsArray,
	TParsedDiagramArray,
	TChoice,
	TChoicesStructure,
	TFork,
	TForksStructure,
	TNote,
	TNotesStructure,
	TState,
	TStatesStructure,
	TAction,
	TActionsStructure,
} from './types/index.js';
import {
	TProcState,
	TProcAction,
	TProcTransitions,
	TStateProcessor,
	TProcStatesArray,
} from './types/stateProcessorTypes.js';

/**
 * @brief This function creates a dictionary of states;
 * @param stateDiagramStructure - base state diagram;
 * @returns Returns a dictionary of states.
 */
function markStates(
	stateDiagramStructure: TStateDiagramStructure
): TProcStatesArray {
	let states: TProcStatesArray = [];
	const stateDiagramNotes = stateDiagramStructure.notes;
	const stateDiagramNotesKeys: Record<string, number> = {};
	for (let i = 0; i < stateDiagramNotes.length; i++) {
		const id: string = stateDiagramNotes[i].over;
		stateDiagramNotesKeys[id] = i;
	}
	for (let i = 0; i < stateDiagramStructure.states.length; i++) {
		const id = stateDiagramStructure.states[i].id;
		const caption = stateDiagramStructure.states[i].caption;
		let notes: string[] = [];
		if (Object.keys(stateDiagramNotesKeys).includes(id)) {
			notes = stateDiagramNotes[stateDiagramNotesKeys[id]].text;
		}
		let actions: string[] = [];
		for (let j = 0; j < stateDiagramStructure.actions.length; j++) {
			if (stateDiagramStructure.actions[j].from === id) {
				actions.push(stateDiagramStructure.actions[j].to);
			}
		}
		const state: TProcState = {
			id,
			caption,
			notes,
			actions,
		};
		states.push(state);
	}
	return states;
}

/**
 * @brief A function that unravel choices in states;
 * @param stateDiagramStructure - base state diagram;
 * @param states - array of states;
 * @returns Returns updated states.
 */
function markChoicesInStates(
	stateDiagramStructure: TStateDiagramStructure,
	states: TProcStatesArray
): TProcStatesArray {
	const choices = stateDiagramStructure.choices;

	for (let i = 0; i < choices.length; i++) {
		const choiceId: string = choices[i].id;
		let choiceState: TProcState = {
			id: choiceId,
			caption: choiceId,
			actions: [],
			notes: [],
		};
		for (let j = 0; j < states.length; j++) {
			if (states[j].id === choiceId) {
				choiceState = states[j];
				break;
			}
		}
		for (let j = 0; j < states.length; j++) {
			if (states[j].actions.includes(choiceId)) {
				states[j].notes = states[j].notes.concat(choiceState.notes);
				const deleteIndex = states[j].actions.indexOf(choiceId);
				states[j].actions.splice(deleteIndex, 1);
				states[j].actions = states[j].actions.concat(
					choiceState.actions
				);
			}
		}
	}

	return states;
}

/**
 * @brief This function creates a dictionary of transitions action;
 * @param stateDiagramStructure - base state diagram;
 * @returns Returns a dictionary of transitions action.
 */
function markTransitions(
	stateDiagramStructure: TStateDiagramStructure
): TProcTransitions {
	const transitions: TProcTransitions = {};
	const stateDiagramActions = stateDiagramStructure.actions;
	for (let i = 0; i < stateDiagramActions.length; i++) {
		const pairOfElements = stateDiagramActions[i];
		const from = pairOfElements.from;
		const to = pairOfElements.to;
		const action = pairOfElements.id;
		if (!Object.keys(transitions).includes(from)) {
			transitions[from] = {};
		}
		if (!Object.keys(transitions[from]).includes(to)) {
			const ProcAction: TProcAction = {
				id: [action],
				notes: [],
			};
			transitions[from][to] = ProcAction;
		} else {
			transitions[from][to].id.push(action);
		}
	}
	return transitions;
}

/**
 * @brief A function that unravel choices in transitions;
 * @param stateDiagramStructure - base state diagram;
 * @param transitions - array of transitions;
 * @returns Returns updated transitions.
 */
function markChoices(
	stateDiagramStructure: TStateDiagramStructure,
	transitions: TProcTransitions
): TProcTransitions {
	const choices: TChoicesStructure = stateDiagramStructure.choices;
	for (const choice of choices) {
		const toChoice: Record<string, TProcAction> = {};
		// find fromChoice
		const fromChoice: Record<string, TProcAction> = transitions[choice.id];
		delete transitions[choice.id];
		// find toChoice
		/*
		const actionKeys = Object.keys(transitions);
		for (let i = 0; i < actionKeys.length; i++) {
			const key: string = actionKeys[i];
			const value = transitions[key];
			if (Object.keys(value).includes(choice.id)) {
				toChoice[key] = value[choice.id];
				delete transitions[key][choice.id];
			}
		}
		const toChoiceKeys = Object.keys(toChoice);
		for (let i = 0; i < toChoiceKeys.length; i++) {
			const from = toChoiceKeys[i];
			const fromChoiceKeys = Object.keys(fromChoice);
			for (let j = 0; j < fromChoiceKeys.length; j++) {
				const to = fromChoiceKeys[j];
				const fromValue: TProcActions = toChoice[from];
				const toValue: TProcActions = fromChoice[to];
				for (const fromValueI of fromValue.id) {
					for (const toValueI of toValue.id) {
						const value = (fromValueI + ' ' + toValueI).trim();
						if (!Object.keys(transitions[from]).includes(to)) {
							transitions[from][to] = {
								id: [value],
								notes: [],
							};
						} else {
							transitions[from][to].id.push(value);
						}
					}
				}
			}
		}
		*/
	}
	return transitions;
}

/**
 * @brief This function creates a state processor;
 * @param diagramText - state diagram string;
 * @returns Returns a dictionary of state processor.
 */
export async function stateProcessor(
	diagramText: string
): Promise<TStateProcessor> {
	const stateDiagramStructure: TStateDiagramStructure =
		await parseStateDiagram(diagramText);

	let states = markStates(stateDiagramStructure);
	states = markChoicesInStates(stateDiagramStructure, states);

	let transitions: TProcTransitions = markTransitions(stateDiagramStructure);
	transitions = markChoices(stateDiagramStructure, transitions);

	const stateProcessor: TStateProcessor = {
		transitions,
		states,
	};
	return stateProcessor;
}
