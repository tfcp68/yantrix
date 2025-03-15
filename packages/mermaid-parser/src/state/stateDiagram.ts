import { compareActionChains, isValidInternalId, isValidStateId } from '../utils/index.js';
import { ChoiceCycleError } from './errors/stateDiagramErrors.js';
import { TActionsStructure, TActionWithParams, TStateDiagramStructure } from './types/index.js';

import {
	TActionChain,
	TActionChainParams,
	TActionPathArray,
	TChoicesId,
	TDiagramAction,
	TDiagramActionChains,
	TDiagramStatesArray,
	TDiagramTransitions,
	TFromChoice,
	TFromChoiceArray,
	TNotesId,
	TStateDiagramMatrix,
} from './types/stateDiagramTypes.js';

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
		if (!note)
			continue;

		if (!Object.keys(notesId).includes(note.over)) {
			notesId[note.over] = [];
		}
		const notesArray: string[] = [];
		for (let j = 0; j < note.text.length; j++) {
			const noteArray = note.text[j]?.trim().split('\n');
			if (!noteArray)
				continue;

			for (let k = 0; k < noteArray.length; k++) {
				const note = noteArray[k];
				if (!note)
					continue;

				notesArray.push(note.trim());
			}
		}
		notesId[note.over]?.push(notesArray);
	}
	return notesId;
}

/**
 * @brief A function that collect choices id;
 * @param stateDiagramStructure - base state diagram;
 * @returns Returns array with choices.
 */
function getChoicesId(stateDiagramStructure: TStateDiagramStructure): TChoicesId {
	const choices = stateDiagramStructure.choices;
	const choicesId: TChoicesId = [];
	for (let i = 0; i < choices.length; i++) {
		const choice = choices[i];
		if (!choice)
			continue;

		choicesId.push(choice.id);
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
	fromChoices: TFromChoiceArray,
): TFromChoiceArray {
	if (!Object.keys(notesId).includes(choice)) {
		notesId[choice] = [['']];
	}
	for (let j = 0; j < notesId[choice]!.length; j++) {
		const noteId = notesId[choice]?.[j];
		if (!noteId)
			continue;

		choiceAction.actionsPath[0]?.note.push(noteId);
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
function getFromChoices(actions: TActionsStructure, choicesId: TChoicesId, notesId: TNotesId): TFromChoiceArray {
	let fromChoices: TFromChoiceArray = [];
	for (let i = 0; i < actions.length; i++) {
		const choice = actions[i]?.to;
		if (!choice)
			continue;

		if (choicesId.includes(choice)) {
			const from = actions[i]?.from;
			if (!from)
				continue;

			const actionId = actions[i]?.id;
			if (!actionId)
				continue;

			const choiceAction: TFromChoice = {
				choice,
				from,
				actionsPath: [
					{
						action: [actionId],
						note: [],
					},
				],
			};
			fromChoices = addNotesForChoices(notesId, choice, choiceAction, fromChoices);
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
function concatActionPathes(fromChoice: TActionPathArray, toChoice: TActionPathArray): TActionPathArray {
	const actionPathArray: TActionPathArray = [];
	for (let i = 0; i < fromChoice.length; i++) {
		for (let j = 0; j < toChoice.length; j++) {
			const toChoiceAction = toChoice[j]?.action;
			if (!toChoiceAction)
				continue;

			const toChoiceNote = toChoice[j]?.note;
			if (!toChoiceNote)
				continue;

			const action = fromChoice[i]?.action.concat(toChoiceAction);
			const note = fromChoice[i]?.note.concat(toChoiceNote);
			if (!action || !note)
				continue;

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
	transitions: TDiagramTransitions,
): TDiagramTransitions {
	if (choicesId.includes(to)) {
		fromChoices.push({
			choice: to,
			from,
			actionsPath: actionPathes,
		});
	} else {
		const transitionsFrom = transitions[from];
		if (!transitionsFrom)
			return transitions;

		if (!Object.keys(transitionsFrom).includes(to)) {
			transitionsFrom[to] = {
				actionsPath: [],
			};
		}

		for (let i = 0; i < actionPathes.length; i++) {
			const actionPath = actionPathes[i];
			if (!actionPath)
				continue;

			transitionsFrom[to]?.actionsPath.push(actionPath);
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
	stateDiagramStructure: TStateDiagramStructure,
): TDiagramTransitions {
	const choices = stateDiagramStructure.choices;
	for (let i = 0; i < choices.length; i++) {
		const choicesId = choices[i]?.id;
		if (choicesId)
			delete transitions[choicesId];
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
	stateDiagramStructure: TStateDiagramStructure,
): TDiagramTransitions {
	const actions = stateDiagramStructure.actions;
	const notesId = getNotesId(stateDiagramStructure);
	const choicesId = getChoicesId(stateDiagramStructure);
	const fromChoices = getFromChoices(actions, choicesId, notesId);

	while (fromChoices.length) {
		const fromChoice = fromChoices[fromChoices.length - 1];
		if (!fromChoice)
			continue;

		if (
			choicesId.includes(fromChoice?.from)
			&& choicesId.includes(fromChoice?.choice)
			&& fromChoice?.from === fromChoice?.choice
		) {
			throw new ChoiceCycleError(`${fromChoice?.from}-->${fromChoice?.choice}`);
		}
		fromChoices.pop();
		const { choice, from } = fromChoice;
		const toChoice = transitions[choice];
		if (!toChoice)
			continue;

		delete transitions[from]?.[choice];
		const toChoiceKeys = Object.keys(toChoice);
		for (let i = 0; i < toChoiceKeys.length; i++) {
			const to = toChoiceKeys[i];
			if (!to)
				continue;

			const fromChoicePath = fromChoice?.actionsPath;
			const toChoicePath = toChoice[to]?.actionsPath;
			if (!fromChoicePath || !toChoicePath)
				continue;

			const actionPathes: TActionPathArray = concatActionPathes(fromChoicePath, toChoicePath);
			transitions = unravelChoices(choicesId, fromChoices, from, to, actionPathes, transitions);
		}
	}

	return deleteRowChoices(transitions, stateDiagramStructure);
}

/**
 * @brief A function that create matrix of transitions;
 * @param stateDiagramStructure - base state diagram;
 * @returns Returns matrix of transitions.
 */
function getTransitions(stateDiagramStructure: TStateDiagramStructure): TDiagramTransitions {
	const transitions: TDiagramTransitions = {};
	const actions = stateDiagramStructure.actions;

	for (let i = 0; i < actions.length; i++) {
		const from = actions[i]?.from;
		const to = actions[i]?.to;
		const actionId = actions[i]?.id;
		if (!from || !to || !actionId)
			continue;

		const action: TDiagramAction = {
			actionsPath: [],
		};
		if (!Object.keys(transitions).includes(from)) {
			transitions[from] = {};
		}

		const transitionsFrom = transitions[from];
		if (!transitionsFrom)
			continue;

		if (!Object.keys(transitionsFrom).includes(to)) {
			transitions[from]![to] = action;
		}

		transitions[from]?.[to]?.actionsPath.push({
			action: [actionId],
			note: [],
		});
	}

	return markChoicesInTransitions(transitions, stateDiagramStructure);
}

/**
 * @brief This function get actions pathes from matrix of transitions;
 * @param transitions - matrix of transitions;
 * @param stateId - The state for which actions pathes is being sought;
 * @returns Returns actions pathes.
 */
function getActionsPathesForStates(transitions: TDiagramTransitions, stateId: string): TActionPathArray {
	const actionsPath: TActionPathArray = [];
	if (!Object.keys(transitions).includes(stateId)) {
		return [];
	}
	const transitionsTo = transitions[stateId];
	if (!transitionsTo)
		return [];

	const transitionsToKeys = Object.keys(transitionsTo);
	for (let i = 0; i < transitionsToKeys.length; i++) {
		const to = transitionsToKeys[i];
		if (!to)
			continue;

		const actionsPathTo = transitionsTo[to]?.actionsPath;
		if (!actionsPathTo)
			continue;

		for (let j = 0; j < actionsPathTo.length; j++) {
			const actionPath = actionsPathTo[j];
			if (!actionPath)
				continue;

			actionsPath.push(actionPath);
		}
	}
	return actionsPath;
}

const formattedStartOrEndDict: Record<string, '[*]'> = {
	'~~~START~~~': '[*]',
	'END_STATE': '[*]',
} as const;

/**
 * @brief This function get states from transitions and stateDiagramStructure;
 * @param stateDiagramStructure - state diagram structure;
 * @param transitions - matrix of transitions;
 * @returns Returns states.
 */
function getStates(
	stateDiagramStructure: TStateDiagramStructure,
	transitions: TDiagramTransitions,
): TDiagramStatesArray {
	const states: TDiagramStatesArray = [];
	const notesId = getNotesId(stateDiagramStructure);
	const notesIdKeys = Object.keys(notesId);
	const choicesId = getChoicesId(stateDiagramStructure);
	for (let i = 0; i < stateDiagramStructure.states.length; i++) {
		const stateId = stateDiagramStructure.states[i]?.id;
		if (!stateId)
			continue;

		if (choicesId.includes(stateId)) {
			continue;
		}
		let notes: string[][] = [];

		const stateIdFormatted = formattedStartOrEndDict[stateId] || stateId;

		if (notesIdKeys.includes(stateIdFormatted)) {
			const notesIdState = notesId[stateIdFormatted];
			if (!notesIdState)
				continue;

			notes = notesIdState;
		}

		const actionsPath: TActionPathArray = getActionsPathesForStates(transitions, stateId);
		const caption = stateDiagramStructure.states[i]?.caption;

		if (!caption)
			continue;

		states.push({
			id: stateId,
			caption,
			actionsPath,
			notes,
		});
	}
	return states;
}

/**
 * @brief Checks if any states in a created structure are not valid;
 * @param states - list of states to check
 * @throw Throws an error if a state has an incorrect format
 */
function checkValidStates(states: TDiagramStatesArray) {
	states.forEach((state) => {
		const { id } = state;
		if (!isValidStateId(id)) {
			throw new Error(`Incorrect ID: ${id}`);
		}
	});
}

/*
	action chains are sequences of actions to be iterated on and processed when encountering forks.
	this structure binds action paths with the exact state that the automata should transition to,
	when every single segment in the chain resolves to TRUE
*/
function createActionChainsFromTransitions(stateDiagramStructure: TStateDiagramStructure, transitions: TDiagramTransitions): TDiagramActionChains {
	const chains: TDiagramActionChains = {};
	for (const state in transitions) {
		const stateTransitions = transitions[state]!;
		const chain: Record<string, TActionChainParams> = {};

		for (const transition in stateTransitions) {
			const actions: string[] | undefined = stateTransitions[transition]?.actionsPath[0]?.action;
			if (actions) {
				const actionName = actions[0]!;
				const actionInStructure = stateDiagramStructure.actions.find(a => a.id === actionName) as TActionWithParams;
				if (!chain[actionName]) {
					chain[actionName] = {
						chains: [],
						params: actionInStructure?.params || null,
					};
				}
				chain[actionName].chains.push({
					chain: actions.slice(1).map((actionId) => {
						const actionInStructure = stateDiagramStructure.actions.find(a => a.id === actionId) as TActionWithParams;
						if (actionInStructure && actionInStructure.predicate === true) {
							return `${actionInStructure.id}(${actionInStructure.params})`;
						}
						return actionId;
					}),
					state: transition,
				});
			}
		}
		chains[state] = chain;
	}
	return chains;
}

/*
	checking default path for every level of action chain / segment of action path
	each level must have not more than 1 default path (i.e its name will be the internal ID instead of action/predicate/etc)
*/
function checkActionChainsDefaultPathsAndSort(actionChains: TDiagramActionChains) {
	for (const state in actionChains) {
		const possibleActions = actionChains[state]!;
		for (const action in possibleActions) {
			const defaultPaths: any = {};
			const { chains } = possibleActions[action]!;
			for (const { chain } of chains) {
				for (let i = 0; i < chain.length; i++) {
					const path = chain[i]!;
					if (isValidInternalId(path)) {
						const nodeId = path.split(', ')[0]!;
						if (defaultPaths[nodeId] !== undefined && defaultPaths[nodeId] !== path) {
							throw new Error(`Duplicate default path encountered: ${path}`);
						} else {
							defaultPaths[nodeId] = path;
						}
					}
				}
			}
			const sortedChains = sortActionChains(chains);
			actionChains[state]![action]!.chains = sortedChains;
		}
	}
}

function sortActionChains(actionChains: TActionChain[]) {
	return actionChains.sort((a, b) => compareActionChains(a.chain, b.chain));
}

function validateActions(stateDiagramStructure: TStateDiagramStructure) {
	const actions = stateDiagramStructure.actions;
	const map: Record<string, Set<string>> = {};
	for (const action of actions) {
		if (!map[action.from]) {
			map[action.from] = new Set();
		}

		if (map[action.from]?.has(action.id)) {
			throw new Error(`Duplicate action ${action.id} identified in state ${action.from}`);
		} else {
			map[action.from]?.add(action.id);
		}
	}
}

/**
 * This function creates a state diagram for Yantrix automata based on the information from a Mermaid diagram
 * @param stateDiagramStructure - State diagram structure;
 * @returns Dictionary of processed state diagram.
 */
export async function createStateDiagram(stateDiagramStructure: TStateDiagramStructure): Promise<TStateDiagramMatrix> {
	validateActions(stateDiagramStructure);
	const transitions = getTransitions(stateDiagramStructure);
	const states = getStates(stateDiagramStructure, transitions);
	const actionChains = createActionChainsFromTransitions(stateDiagramStructure, transitions);
	checkValidStates(states);
	checkActionChainsDefaultPathsAndSort(actionChains);
	return {
		transitions,
		states,
		actionChains,
	};
}
