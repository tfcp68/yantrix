import { TStateDiagramStructure, TActionsStructure } from './types/index.js';
import {
	TDiagramState,
	TDiagramAction,
	TDiagramTransitions,
	TStateDiagram,
	TDiagramStatesArray,
	TFromChoice,
} from './types/stateDiagramTypes.js';

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
		const choice = fromChoice.choice;
		const from = fromChoice.from;
		const action = fromChoice.action;
		const note = fromChoice.note;
		const toChoice = transitions[choice];
		delete transitions[from][choice];
		const toChoiceKeys = Object.keys(toChoice);
		for (let i = 0; i < toChoiceKeys.length; i++) {
			const to = toChoiceKeys[i];
			const toActionId = toChoice[to].id;
			const toActionNotes = toChoice[to].notes;
			const concatActions: string[][] = concatArrays(action, toActionId);
			const concatNotes: string[][] = [];
			for (let i = 0; i < toActionNotes.length; i++) {
				concatNotes.push(toActionNotes[i]);
			}
			for (
				let i = concatNotes.length;
				concatNotes.length < concatActions.length;
				i++
			) {
				concatNotes.push([]);
			}
			for (let i = 0; i < concatActions.length; i++) {
				for (let j = 0; j < note.length; j++) {
					concatNotes[i] = concatNotes[i].concat(note[j]);
				}
			}
			if (choicesId.includes(to)) {
				fromChoices.push({
					choice: to,
					from,
					action: concatActions,
					note: concatNotes,
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
				transitions[from][to].notes =
					transitions[from][to].notes.concat(concatNotes);
			}
		}
	}
	const choices = stateDiagramStructure.choices;
	for (let i = 0; i < choices.length; i++) {
		delete transitions[choices[i].id];
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
