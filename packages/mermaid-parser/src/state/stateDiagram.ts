import { TStateDiagramStructure, TActionsStructure } from './types/index.js';
import {
	TDiagramState,
	TDiagramAction,
	TDiagramTransitions,
	TStateDiagram,
	TDiagramStatesArray,
	TFromChoice,
} from './types/stateDiagramTypes.js';

import { ChoiceCycleError } from './errors/stateDiagramErrors.js';
/**
 * @brief A function that concat two matrices;
 * @param array1 - first matrix;
 * @param array2 - second matrix;
 * @returns Returns matrix after concatenation.
 */
function concatArrays(array1: string[][], array2: string[][]): string[][] {
	const concatArray: string[][] = [];
	for (let i = 0; i < array1.length; i++) {
		for (let j = 0; j < array2.length; j++) {
			const concatAction: string[] = array1[i].concat(array2[j]);
			concatArray.push(concatAction);
		}
	}
	return concatArray;
}

/**
 * @brief A function that collect notes id;
 * @param stateDiagramStructure - base state diagram;
 * @returns Returns dict with notes.
 */
function getNotesId(
	stateDiagramStructure: TStateDiagramStructure
): Record<string, string[][]> {
	const notes = stateDiagramStructure.notes;
	const notesId: Record<string, string[][]> = {};

	for (let i = 0; i < notes.length; i++) {
		const note = notes[i];
		if (!Object.keys(notesId).includes(note.over)) {
			notesId[note.over] = [];
		}
		notesId[note.over].push(note.text);
	}
	return notesId;
}

/**
 * @brief A function that collect choices id;
 * @param stateDiagramStructure - base state diagram;
 * @returns Returns array with choices.
 */
function getChoicesId(stateDiagramStructure: TStateDiagramStructure): string[] {
	const choices = stateDiagramStructure.choices;
	const choicesId: string[] = [];
	for (let i = 0; i < choices.length; i++) {
		choicesId.push(choices[i].id);
	}
	return choicesId;
}

/**
 * @brief A function that collect actions id, which leads to states 'from' and 'to';
 * @param stateDiagramStructure - base state diagram;
 * @returns Returns dict with actions.
 */
function getActionsId(
	stateDiagramStructure: TStateDiagramStructure
): Record<string, { from: string; to: string }> {
	const actions = stateDiagramStructure.actions;
	const actionId: Record<string, { from: string; to: string }> = {};
	for (let i = 0; i < actions.length; i++) {
		actionId[actions[i].id] = {
			from: actions[i].from,
			to: actions[i].to,
		};
	}
	return actionId;
}

/**
 * @brief A function that create from choices array;
 * @param actions - actions from stateDiagramStructure;
 * @param choicesId - array with choices;
 * @param notesId - dict with notes;
 * @returns Returns from choices array.
 */
function getFromChoices(
	actions: TActionsStructure,
	choicesId: string[],
	notesId: Record<string, string[][]>
): TFromChoice[] {
	const fromChoices: TFromChoice[] = [];
	for (let i = 0; i < actions.length; i++) {
		const choice = actions[i].to;
		if (choicesId.includes(actions[i].to)) {
			const choiceAction: TFromChoice = {
				choice,
				from: actions[i].from,
				action: [[actions[i].id]],
				note: [],
			};
			if (!Object.keys(notesId).includes(choice)) {
				notesId[choice] = [['']];
			}
			for (let j = 0; j < notesId[choice].length; j++) {
				const noteId: string[] = notesId[choice][j];
				choiceAction.note.push(noteId);
			}
			fromChoices.push(choiceAction);
		}
	}
	return fromChoices;
}

/**
 * @brief A function unravel choice;
 * @param choicesId - array with choices;
 * @param fromChoices - array with states, where the action is coming from;
 * @param concatActions - array with actions;
 * @param from - state, where the action is coming from;
 * @param to - state, where the action is coming to;
 * @param transitions - matrix of transitions;
 * @returns Returns updated transitions.
 */
function unravelChoices(
	choicesId: string[],
	fromChoices: TFromChoice[],
	concatActions: string[][],
	from: string,
	to: string,
	transitions: TDiagramTransitions
): TDiagramTransitions {
	if (choicesId.includes(to)) {
		fromChoices.push({
			choice: to,
			from,
			action: concatActions,
			note: [],
		});
	} else {
		if (!Object.keys(transitions[from]).includes(to)) {
			transitions[from][to] = {
				id: [],
				notes: [],
			};
		}
		transitions[from][to].id =
			transitions[from][to].id.concat(concatActions);
	}
	return transitions;
}

/**
 * @brief A function delete rows of choices;
 * @param transitions - matrix of transitions;
 * @param stateDiagramStructure - base state diagram;
 * @returns Returns updated transitions.
 */
function deleteRowChoices(
	transitions: TDiagramTransitions,
	stateDiagramStructure: TStateDiagramStructure
): TDiagramTransitions {
	const choices = stateDiagramStructure.choices;
	for (let i = 0; i < choices.length; i++) {
		delete transitions[choices[i].id];
	}

	return transitions;
}

/**
 * @brief A function that unravel choices in transitions;
 * @param transitions - matrix of transitions;
 * @param stateDiagramStructure - base state diagram;
 * @returns Returns updated transitions.
 */
function markChoicesInTransitions(
	transitions: TDiagramTransitions,
	stateDiagramStructure: TStateDiagramStructure
): TDiagramTransitions {
	const actions = stateDiagramStructure.actions;
	const notesId = getNotesId(stateDiagramStructure);
	const choicesId = getChoicesId(stateDiagramStructure);
	const fromChoices = getFromChoices(actions, choicesId, notesId);

	while (fromChoices.length) {
		const fromChoice = fromChoices[fromChoices.length - 1];
		fromChoices.pop();
		const { action, choice, from } = fromChoice;
		const toChoice = transitions[choice];
		delete transitions[from][choice];
		const toChoiceKeys = Object.keys(toChoice);
		for (let i = 0; i < toChoiceKeys.length; i++) {
			const to = toChoiceKeys[i];
			if (
				choicesId.includes(from) &&
				choicesId.includes(to) &&
				from === to
			) {
				throw new ChoiceCycleError();
			}
			const toActionId = toChoice[to].id;
			const concatActions = concatArrays(action, toActionId);
			transitions = unravelChoices(
				choicesId,
				fromChoices,
				concatActions,
				from,
				to,
				transitions
			);
		}
	}
	transitions = deleteRowChoices(transitions, stateDiagramStructure);
	return transitions;
}

/**
 * @brief A function mark choice notes in transitions;
 * @param transitions - matrix of transitions;
 * @param stateDiagramStructure - base state diagram;
 * @returns Returns updated transitions.
 */
function getChoiceNotes(
	transitions: TDiagramTransitions,
	stateDiagramStructure: TStateDiagramStructure
): TDiagramTransitions {
	const actionsId = getActionsId(stateDiagramStructure);
	const choicesId = getChoicesId(stateDiagramStructure);
	const notesId = getNotesId(stateDiagramStructure);
	const fromChoices = getFromChoices(
		stateDiagramStructure.actions,
		choicesId,
		notesId
	);
	const fromChoice: string[] = [];
	for (let i = 0; i < fromChoices.length; i++) {
		const from = fromChoices[i].from;
		if (!choicesId.includes(from)) {
			fromChoice.push(from);
		}
	}
	//todo не работает, когда одинаковые action
	for (let i = 0; i < fromChoice.length; i++) {
		const from = fromChoice[i];
		const transitionsFromKeys = Object.keys(transitions[from]);
		for (let j = 0; j < transitionsFromKeys.length; j++) {
			const to = transitionsFromKeys[j];
			const actionsArray = transitions[from][to].id;
			for (let k = 0; k < actionsArray.length; k++) {
				const actionArray = actionsArray[k];
				let notes: string[] = [];
				if (actionArray.length > 1) {
					for (let m = 0; m < actionArray.length; m++) {
						const action = actionArray[m];
						const choice = actionsId[action].to;
						if (choicesId.includes(choice)) {
							const notesIdKeys = Object.keys(notesId);
							if (notesIdKeys.includes(choice)) {
								notes = notes.concat(notesId[choice][0]);
							} else {
								notes = notes.concat('');
							}
						}
					}
				}
				transitions[from][to].notes.push(notes);
			}
		}
	}
	return transitions;
}

/**
 * @brief A function that create matrix of transitions;
 * @param stateDiagramStructure - base state diagram;
 * @returns Returns matrix of transitions.
 */
function getTransitions(
	stateDiagramStructure: TStateDiagramStructure
): TDiagramTransitions {
	let transitions: TDiagramTransitions = {};
	const actions = stateDiagramStructure.actions;

	for (let i = 0; i < actions.length; i++) {
		const from = actions[i].from;
		const to = actions[i].to;
		const actionId = actions[i].id;

		const action: TDiagramAction = {
			id: [],
			notes: [],
		};

		if (!Object.keys(transitions).includes(from)) {
			transitions[from] = {};
		}
		if (!Object.keys(transitions[from]).includes(to)) {
			transitions[from][to] = action;
		}
		transitions[from][to].id.push([actionId]);
	}

	transitions = markChoicesInTransitions(transitions, stateDiagramStructure);
	transitions = getChoiceNotes(transitions, stateDiagramStructure);
	return transitions;
}

/**
 * @brief This function get action from matrix of transitions;
 * @param transitions - matrix of transitions;
 * @param stateId - The state for which action is being sought;
 * @returns Returns states.
 */
function getActionsForStates(
	transitions: TDiagramTransitions,
	stateId: string
): string[][] {
	const actions: string[][] = [];
	if (!Object.keys(transitions).includes(stateId)) {
		return [];
	}
	const transitionsTo = transitions[stateId];
	const transitionsToKeys = Object.keys(transitionsTo);
	for (let i = 0; i < transitionsToKeys.length; i++) {
		const to = transitionsToKeys[i];
		const actionsToId: string[][] = transitionsTo[to].id;
		for (let j = 0; j < actionsToId.length; j++) {
			actions.push(actionsToId[j]);
		}
	}
	return actions;
}

/**
 * @brief This function get states from transitions and stateDiagramStructure;
 * @param stateDiagramStructure - state diagram structure;
 * @param transitions - matrix of transitions;
 * @returns Returns states.
 */
function getStates(
	stateDiagramStructure: TStateDiagramStructure,
	transitions: TDiagramTransitions
): TDiagramStatesArray {
	const states: TDiagramStatesArray = [];
	const notesId = getNotesId(stateDiagramStructure);
	const notesIdKeys = Object.keys(notesId);
	const choicesId = getChoicesId(stateDiagramStructure);
	for (let i = 0; i < stateDiagramStructure.states.length; i++) {
		const stateId = stateDiagramStructure.states[i].id;
		if (choicesId.includes(stateId)) {
			continue;
		}
		let notes: string[][] = [];
		if (notesIdKeys.includes(stateId)) {
			notes = notesId[stateId];
		}
		const actions: string[][] = getActionsForStates(transitions, stateId);
		const state: TDiagramState = {
			id: stateId,
			caption: stateDiagramStructure.states[i].caption,
			notes,
			actions,
		};
		states.push(state);
	}
	return states;
}

/**
 * @brief This function creates a state diagram;
 * @param stateDiagramStructure - state diagram structure;
 * @returns Returns a dictionary of state diagram.
 */
export async function createStateDiagram(
	stateDiagramStructure: TStateDiagramStructure
): Promise<TStateDiagram> {
	const transitions = getTransitions(stateDiagramStructure);
	const states = getStates(stateDiagramStructure, transitions);
	return {
		transitions,
		states,
	};
}
