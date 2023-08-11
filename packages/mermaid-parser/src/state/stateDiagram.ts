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
	TDiagramState,
	TDiagramAction,
	TDiagramTransitions,
	TStateDiagram,
	TDiagramStatesArray,
	TStateMatrix,
} from './types/stateDiagramTypes.js';

/**
 * @brief This function creates a dictionary of states;
 * @param stateDiagramStructure - base state diagram;
 * @returns Returns a dictionary of states.
 */
function markStates(
	stateDiagramStructure: TStateDiagramStructure
): TDiagramStatesArray {
	let states: TDiagramStatesArray = [];
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
		const state: TDiagramState = {
			id,
			caption,
			notes,
			actions,
		};
		states.push(state);
	}
	return states;
}

function markChoicesInMatrix(
	matrix: TStateMatrix,
	stateDiagramStructure: TStateDiagramStructure
): TStateMatrix {
	const actions = stateDiagramStructure.actions.reverse();
	const choices = stateDiagramStructure.choices;
	const choicesId: string[] = [];
	type TFromChoice = {
		choice: string;
		from: string;
		action: string[][];
	};
	const fromChoices: TFromChoice[] = [];
	for (let i = 0; i < choices.length; i++) {
		choicesId.push(choices[i].id);
	}
	for (let i = 0; i < actions.length; i++) {
		if (choicesId.includes(actions[i].to)) {
			fromChoices.push({
				choice: actions[i].to,
				from: actions[i].from,
				action: [[actions[i].id]],
			});
		}
	}

	while (fromChoices.length) {
		const fromChoice = fromChoices[fromChoices.length - 1];
		fromChoices.pop();
		const choice = fromChoice.choice;
		const from = fromChoice.from;
		const action = fromChoice.action;
		const toChoice = matrix[choice];
		delete matrix[from][choice];

		for (let to in toChoice) {
			const toAction = toChoice[to];

			const concatActions: string[][] = [];
			for (let i = 0; i < action.length; i++) {
				for (let j = 0; j < toAction.length; j++) {
					const concatAction: string[] = action[i].concat(
						toAction[j]
					);
					concatActions.push(concatAction);
				}
			}
			if (choicesId.includes(to)) {
				fromChoices.push({
					choice: to,
					from,
					action: concatActions,
				});
			} else {
				if (!Object.keys(matrix[from]).includes(to)) {
					matrix[from][to] = [];
				}
				matrix[from][to] = matrix[from][to].concat(concatActions);
			}
		}
	}
	for (let i = 0; i < choices.length; i++) {
		delete matrix[choices[i].id];
	}
	return matrix;
}

function createMatrix(
	stateDiagramStructure: TStateDiagramStructure
): TStateMatrix {
	let matrix: TStateMatrix = {};
	const actions = stateDiagramStructure.actions;
	for (let i = 0; i < actions.length; i++) {
		const from = actions[i].from;
		const to = actions[i].to;
		const action = actions[i].id;

		if (!Object.keys(matrix).includes(from)) {
			matrix[from] = {};
		}
		if (!Object.keys(matrix[from]).includes(to)) {
			matrix[from][to] = [];
		}
		matrix[from][to].push([action]);
	}

	matrix = markChoicesInMatrix(matrix, stateDiagramStructure);
	return matrix;
}

/**
 * @brief A function that unravel choices in states;
 * @param stateDiagramStructure - base state diagram;
 * @param states - array of states;
 * @returns Returns updated states.
 */
function markChoicesInStates(
	stateDiagramStructure: TStateDiagramStructure,
	states: TDiagramStatesArray
): TDiagramStatesArray {
	const choices = stateDiagramStructure.choices;

	for (let i = 0; i < choices.length; i++) {
		const choiceId: string = choices[i].id;
		let choiceState: TDiagramState = {
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
): TDiagramTransitions {
	const transitions: TDiagramTransitions = {};
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
			const ProcAction: TDiagramAction = {
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
	transitions: TDiagramTransitions
): TDiagramTransitions {
	const choices: TChoicesStructure = stateDiagramStructure.choices;
	for (const choice of choices) {
		const toChoice: Record<string, TDiagramAction> = {};
		// find fromChoice
		const fromChoice: Record<string, TDiagramAction> =
			transitions[choice.id];
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
 * @brief This function creates a state diagram;
 * @param diagramText - state diagram string;
 * @returns Returns a dictionary of state diagram.
 */
export async function createStateDiagram(
	stateDiagramStructure: TStateDiagramStructure
): Promise<TStateDiagram> {
	const matrix = createMatrix(stateDiagramStructure);

	const states = markChoicesInStates(
		stateDiagramStructure,
		markStates(stateDiagramStructure)
	);

	const transitions = markChoices(
		stateDiagramStructure,
		markTransitions(stateDiagramStructure)
	);

	return {
		transitions,
		states,
	};
}
