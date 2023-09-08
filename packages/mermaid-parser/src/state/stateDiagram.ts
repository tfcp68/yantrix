import { TStateDiagramStructure, TActionsStructure } from './types/index.js';
import {
	TDiagramState,
	TDiagramAction,
	TDiagramTransitions,
	TStateDiagram,
	TDiagramStatesArray,
	TFromChoice,
	TActionPathArray,
	TNotesId,
	TChoicesId,
	TFromChoiceArray,
} from './types/stateDiagramTypes.js';

import { ChoiceCycleError } from './errors/stateDiagramErrors.js';

/**
 * @brief A function collect notes from state;
 * @param stateDiagramStructure - base state diagram;
 * @returns Returns dict with notes.
 */
function getNotesId(stateDiagramStructure: TStateDiagramStructure): TNotesId {
	const notes = stateDiagramStructure.notes;
	const notesId: TNotesId = {};

	for (let i = 0; i < notes.length; i++) {
		const note = notes[i];
		if (!Object.keys(notesId).includes(note.over)) {
			notesId[note.over] = [];
		}
		const notesArray: string[] = [];
		for (let j = 0; j < note.text.length; j++) {
			const noteArray: string[] = note.text[j].trim().split('\n');
			for (let k = 0; k < noteArray.length; k++) {
				notesArray.push(noteArray[k].trim());
			}
		}
		notesId[note.over].push(notesArray);
	}
	return notesId;
}

/**
 * @brief A function that collect choices id;
 * @param stateDiagramStructure - base state diagram;
 * @returns Returns array with choices.
 */
function getChoicesId(
	stateDiagramStructure: TStateDiagramStructure
): TChoicesId {
	const choices = stateDiagramStructure.choices;
	const choicesId: TChoicesId = [];
	for (let i = 0; i < choices.length; i++) {
		choicesId.push(choices[i].id);
	}
	return choicesId;
}

/**
 * @brief A function add notes for choices;
 * @param notesId - dict with notes;
 * @param choice - choice state from which notes are collected;
 * @param choiceAction - the action in which notes are recorded;
 * @param fromChoices - actions that happens before choice;
 * @returns Returns updated fromChoices.
 */
function addNotesForChoices(
	notesId: TNotesId,
	choice: string,
	choiceAction: TFromChoice,
	fromChoices: TFromChoiceArray
): TFromChoiceArray {
	if (!Object.keys(notesId).includes(choice)) {
		notesId[choice] = [['']];
	}
	for (let j = 0; j < notesId[choice].length; j++) {
		const noteId: string[] = notesId[choice][j];
		choiceAction.actionsPath[0].note.push(noteId);
	}
	fromChoices.push(choiceAction);

	return fromChoices;
}

/**
 * @brief A function collect actions that happens before choice;
 * @param actions - actions from stateDiagramStructure;
 * @param choicesId - array with choices;
 * @param notesId - dict with notes;
 * @returns Returns from choices array.
 */
function getFromChoices(
	actions: TActionsStructure,
	choicesId: TChoicesId,
	notesId: TNotesId
): TFromChoiceArray {
	let fromChoices: TFromChoiceArray = [];
	for (let i = 0; i < actions.length; i++) {
		const choice = actions[i].to;
		if (choicesId.includes(actions[i].to)) {
			const choiceAction: TFromChoice = {
				choice,
				from: actions[i].from,
				actionsPath: [
					{
						action: [actions[i].id],
						note: [],
					},
				],
			};
			fromChoices = addNotesForChoices(
				notesId,
				choice,
				choiceAction,
				fromChoices
			);
		}
	}
	return fromChoices;
}

/**
 * @brief A function that concat two action pathes;
 * @param fromChoice - first action path;
 * @param toChoice - second action path;
 * @returns Returns action path after concatenation.
 */
function concatActionPathes(
	fromChoice: TActionPathArray,
	toChoice: TActionPathArray
): TActionPathArray {
	const actionPathArray: TActionPathArray = [];
	for (let i = 0; i < fromChoice.length; i++) {
		for (let j = 0; j < toChoice.length; j++) {
			const action = fromChoice[i].action.concat(toChoice[j].action);
			const note = fromChoice[i].note.concat(toChoice[j].note);
			actionPathArray.push({ action, note });
		}
	}
	return actionPathArray;
}

/**
 * @brief A function unravel choice;
 * @param choicesId - array with choices;
 * @param fromChoices - array with states, where the action is coming from;
 * @param from - state, where the action is coming from;
 * @param to - state, where the action is coming to;
 * @param transitions - matrix of transitions;
 * @returns Returns updated transitions.
 */
function unravelChoices(
	choicesId: TChoicesId,
	fromChoices: TFromChoiceArray,
	from: string,
	to: string,
	actionPathes: TActionPathArray,
	transitions: TDiagramTransitions
): TDiagramTransitions {
	if (choicesId.includes(to)) {
		fromChoices.push({
			choice: to,
			from,
			actionsPath: actionPathes,
		});
	} else {
		if (!Object.keys(transitions[from]).includes(to)) {
			transitions[from][to] = {
				actionsPath: [],
			};
		}

		for (let i = 0; i < actionPathes.length; i++) {
			transitions[from][to].actionsPath.push(actionPathes[i]);
		}
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
		if (
			choicesId.includes(fromChoice.from) &&
			choicesId.includes(fromChoice.choice) &&
			fromChoice.from === fromChoice.choice
		) {
			throw new ChoiceCycleError(
				fromChoice.from + '-->' + fromChoice.choice
			);
		}
		fromChoices.pop();
		const { choice, from } = fromChoice;
		const toChoice = transitions[choice];
		delete transitions[from][choice];
		const toChoiceKeys = Object.keys(toChoice);
		for (let i = 0; i < toChoiceKeys.length; i++) {
			const to = toChoiceKeys[i];
			const fromChoicePath = fromChoice.actionsPath;
			const toChoicePath = toChoice[to].actionsPath;
			const actionPathes: TActionPathArray = concatActionPathes(
				fromChoicePath,
				toChoicePath
			);
			transitions = unravelChoices(
				choicesId,
				fromChoices,
				from,
				to,
				actionPathes,
				transitions
			);
		}
	}
	transitions = deleteRowChoices(transitions, stateDiagramStructure);
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
			actionsPath: [],
		};
		if (!Object.keys(transitions).includes(from)) {
			transitions[from] = {};
		}
		if (!Object.keys(transitions[from]).includes(to)) {
			transitions[from][to] = action;
		}
		transitions[from][to].actionsPath.push({
			action: [actionId],
			note: [],
		});
	}
	transitions = markChoicesInTransitions(transitions, stateDiagramStructure);
	return transitions;
}

/**
 * @brief This function get actions pathes from matrix of transitions;
 * @param transitions - matrix of transitions;
 * @param stateId - The state for which actions pathes is being sought;
 * @returns Returns actions pathes.
 */
function getActionsPathesForStates(
	transitions: TDiagramTransitions,
	stateId: string
): TActionPathArray {
	const actionsPath: TActionPathArray = [];
	if (!Object.keys(transitions).includes(stateId)) {
		return [];
	}
	const transitionsTo = transitions[stateId];
	const transitionsToKeys = Object.keys(transitionsTo);
	for (let i = 0; i < transitionsToKeys.length; i++) {
		const to = transitionsToKeys[i];
		const actionsPathTo: TActionPathArray = transitionsTo[to].actionsPath;
		for (let j = 0; j < actionsPathTo.length; j++) {
			actionsPath.push(actionsPathTo[j]);
		}
	}
	return actionsPath;
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
		const actionsPath: TActionPathArray = getActionsPathesForStates(
			transitions,
			stateId
		);
		const state: TDiagramState = {
			id: stateId,
			caption: stateDiagramStructure.states[i].caption,
			actionsPath,
			notes,
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
