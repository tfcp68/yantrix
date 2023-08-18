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
	TFromChoice,
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
 * @brief A function that unravel choices in transitions;
 * @param matrix Matrix of transitions
 * @param stateDiagramStructure - base state diagram;
 * @returns Returns updated transitions.
 */
function markChoicesInMatrix(
	matrix: TDiagramTransitions,
	stateDiagramStructure: TStateDiagramStructure
): TDiagramTransitions {
	const actions = stateDiagramStructure.actions;
	const choices = stateDiagramStructure.choices;
	const choicesId: string[] = [];
	const notes = stateDiagramStructure.notes;
	const notesId: Record<string, string[][]> = {};

	for (let i = 0; i < notes.length; i++) {
		const note = notes[i];
		if (!Object.keys(notesId).includes(note.over)) {
			notesId[note.over] = [];
		}
		notesId[note.over].push(note.text);
	}
	const fromChoices: TFromChoice[] = [];
	for (let i = 0; i < choices.length; i++) {
		choicesId.push(choices[i].id);
	}
	for (let i = 0; i < actions.length; i++) {
		const choice = actions[i].to;
		if (choicesId.includes(actions[i].to)) {
			let choiceAction: TFromChoice = {
				choice: choice,
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

	while (fromChoices.length) {
		const fromChoice = fromChoices[fromChoices.length - 1];
		fromChoices.pop();
		const choice = fromChoice.choice;
		const from = fromChoice.from;
		const action = fromChoice.action;
		const note = fromChoice.note;
		const toChoice = matrix[choice];
		delete matrix[from][choice];
		for (let to in toChoice) {
			const toActionId = toChoice[to].id;
			const toActionNotes = toChoice[to].notes;
			const concatActions: string[][] = concatArrays(action, toActionId);
			let concatNotes: string[][] = [];
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
				if (!Object.keys(matrix[from]).includes(to)) {
					matrix[from][to] = {
						id: [],
						notes: [],
					};
				}
				matrix[from][to].id = matrix[from][to].id.concat(concatActions);
				matrix[from][to].notes =
					matrix[from][to].notes.concat(concatNotes);
			}
		}
	}
	for (let i = 0; i < choices.length; i++) {
		delete matrix[choices[i].id];
	}
	return matrix;
}

/**
 * @brief A function that create matrix of transitions;
 * @param stateDiagramStructure - base state diagram;
 * @returns Returns matrix of transitions.
 */
function createMatrix(
	stateDiagramStructure: TStateDiagramStructure
): TDiagramTransitions {
	let matrix: TDiagramTransitions = {};
	const actions = stateDiagramStructure.actions;

	for (let i = 0; i < actions.length; i++) {
		const from = actions[i].from;
		const to = actions[i].to;
		const actionId = actions[i].id;

		const action: TDiagramAction = {
			id: [],
			notes: [],
		};

		if (!Object.keys(matrix).includes(from)) {
			matrix[from] = {};
		}
		if (!Object.keys(matrix[from]).includes(to)) {
			matrix[from][to] = action;
		}
		matrix[from][to].id.push([actionId]);
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
 * @brief This function creates a state diagram;
 * @param diagramText - state diagram string;
 * @returns Returns a dictionary of state diagram.
 */
export async function createStateDiagram(
	stateDiagramStructure: TStateDiagramStructure
): Promise<TStateDiagram> {
	const transitions = createMatrix(stateDiagramStructure);

	const states = markChoicesInStates(
		stateDiagramStructure,
		markStates(stateDiagramStructure)
	);

	return {
		transitions,
		states,
	};
}
