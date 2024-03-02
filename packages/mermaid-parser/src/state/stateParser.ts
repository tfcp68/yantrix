import mermaid from 'mermaid';
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

import { InvalidInputError, BlankInputError } from './errors/stateErrors.js';
/**
 * @brief Function that parses a diagram;
 * @param diagramText - diagram [string];
 * @returns Returns parsed diagram dictionary.
 */
async function diagramParser(
	diagramText: string,
): Promise<TParsedDiagramArray> {
	diagramText = diagramText.trim().replaceAll('\t', '');
	if (diagramText === '') {
		throw new BlankInputError();
	}
	try {
		mermaid.mermaidAPI.setConfig({
			...mermaid.mermaidAPI.defaultConfig,
		});
		await mermaid.mermaidAPI.initialize();
		const diagram =
			await mermaid.mermaidAPI.getDiagramFromText(diagramText);
		const parsedDiagram: TParsedDiagramArray = diagram.db.getRootDoc();
		return parsedDiagram;
	} catch (e) {
		throw new InvalidInputError((e as Error).message);
	}
}

/**
 * @brief This function collects transitions from a diagram;
 * @param parsedDiagram - a primary diagram dictionary;
 * @returns Returns the transitions from the diagram and their descriptions.
 */
function getTransitions(parsedDiagram: TParsedDiagramArray): TTransitionsArray {
	const transitions: TTransitionsArray = [];
	for (let i = 0; i < parsedDiagram.length; i++) {
		if (parsedDiagram[i].stmt === 'relation') {
			const directionI: string[] = [];
			const tempSt1: Record<string, string> = parsedDiagram[i]
				.state1 as Record<string, string>;
			const tempSt2: Record<string, string> = parsedDiagram[i]
				.state2 as Record<string, string>;
			const st1: string = tempSt1.id;
			const st2: string = tempSt2.id;
			if (st1 === '[*]' && st2 === '[*]') {
				directionI.push('~~~START~~~');
				directionI.push('~~~END~~~');
			}
			if (st1 === '[*]') {
				directionI.push('~~~START~~~');
				directionI.push(st2);
			} else if (st2 === '[*]') {
				directionI.push(st1);
				directionI.push('~~~END~~~');
			} else {
				directionI.push(st1);
				directionI.push(st2);
			}
			const keys = Object.keys(parsedDiagram[i]);
			if (keys.includes('description')) {
				const descr: string = parsedDiagram[i].description as string;
				directionI.push(descr);
			} else {
				directionI.push('');
			}
			transitions.push(directionI);
		}
	}
	return transitions;
}

/**
 * @brief This function collects the state captions(descriptions);
 * @param diagramStates - array of diagram elements;
 * @returns Returns an dictionary of state captions.
 */
function getStatesCaption(
	parsedDiagram: TParsedDiagramArray,
): Record<string, string> {
	const stateCaptions: Record<string, string> = {};
	for (let i = 0; i < parsedDiagram.length; i++) {
		if (parsedDiagram[i].stmt === 'state') {
			const keys = Object.keys(parsedDiagram[i]);
			if (keys.includes('type')) {
				if (parsedDiagram[i].type === 'default') {
					const stateId: string = parsedDiagram[i].id as string;
					const stateDesc: string = parsedDiagram[i]
						.description as string;
					stateCaptions[stateId] = stateDesc;
				}
			}
		}
	}
	return stateCaptions;
}

/**
 * @brief This function collects the elements that are in the mermaid state diagram;
 * @param transitions - array of transitions;
 * @returns Returns an array of diagram elements.
 */
function getStates(
	parsedDiagram: TParsedDiagramArray,
	transitions: TTransitionsArray,
): TStatesStructure {
	const diagramStates: TStatesStructure = [];
	const stateCaptions: Record<string, string> =
		getStatesCaption(parsedDiagram);
	const stateCaptionKeys = Object.keys(stateCaptions);
	const visited: string[] = [];
	for (let i = 0; i < transitions.length; i++) {
		for (let j = 0; j < 2; j++) {
			const element = transitions[i][j];
			if (!visited.includes(element)) {
				const state: TState = {
					id: element,
					caption: element,
				};
				if (stateCaptionKeys.includes(element)) {
					state.caption = stateCaptions[element];
				}
				diagramStates.push(state);
				visited.push(element);
			}
		}
	}
	return diagramStates;
}

/**
 * @brief A function that finds choice elements;
 * @param parsedDiagram - a primary diagram dictionary;
 * @returns Returns array with choice elements;
 */
function getChoices(parsedDiagram: TParsedDiagramArray): TChoicesStructure {
	const choices: TChoicesStructure = [];
	for (let i = 0; i < parsedDiagram.length; i++) {
		if (parsedDiagram[i].stmt === 'state') {
			const keys = Object.keys(parsedDiagram[i]);
			if (keys.includes('type')) {
				const stateType = parsedDiagram[i].type;
				if (stateType === 'choice') {
					const choiceElement = parsedDiagram[i].id as string;
					const choice: TChoice = {
						id: choiceElement,
					};
					choices.push(choice);
				}
			}
		}
	}
	return choices;
}

/**
 * @brief A function that finds fork and join elements;
 * @param parsedDiagram - a primary diagram dictionary;
 * @returns Returns array with fork and join elements;
 */
function getForks(parsedDiagram: TParsedDiagramArray): TForksStructure {
	const forks: TForksStructure = [];
	for (let i = 0; i < parsedDiagram.length; i++) {
		if (parsedDiagram[i].stmt === 'state') {
			const keys = Object.keys(parsedDiagram[i]);
			if (keys.includes('type')) {
				const stateType = parsedDiagram[i].type;
				if (stateType === 'fork' || stateType === 'join') {
					const forkElement = parsedDiagram[i].id as string;
					const fork: TFork = {
						id: forkElement,
					};
					forks.push(fork);
				}
			}
		}
	}
	return forks;
}

/**
 * @brief A function that extracts notes from the state diagram;
 * @param parsedDiagram - a primary diagram dictionary;
 * @param diagramStates - array of diagram elements;
 * @returns Returns a dictionary of notes from the state diagram.
 */
function getNotes(parsedDiagram: TParsedDiagramArray): TNotesStructure {
	const notes: TNotesStructure = [];
	const visited: Record<string, number> = {};
	let visitedCount = 0;
	for (let i = 0; i < parsedDiagram.length; i++) {
		if (parsedDiagram[i].stmt === 'state') {
			const keys = Object.keys(parsedDiagram[i]);
			if (keys.includes('note')) {
				const noteKeys = Object.keys(parsedDiagram[i].note);
				if (noteKeys.includes('text')) {
					const from: string = parsedDiagram[i].id as string;
					const parsedDiagramNote: Record<string, string> =
						parsedDiagram[i].note as Record<string, string>;
					const noteText: string = parsedDiagramNote.text;
					const visitedKeys = Object.keys(visited);
					if (visitedKeys.includes(from)) {
						notes[visited[from]].text.push(noteText);
					} else {
						const note: TNote = {
							text: [noteText],
							over: from,
						};
						notes.push(note);
						visited[from] = visitedCount;
						visitedCount++;
					}
				}
			}
		}
	}
	return notes;
}

/**
 * @brief This function generate unique id for anonymous action;
 * @param from - state, where the action is coming from;
 * @param to - state, where the action is coming to;
 * @param i - order number;
 * @returns Returns unique id for anonymous action.
 */
function generateIdForAnonymousAction(from: string, to: string, num: number) {
	return from + ', ' + to + ', ' + String(num);
}
/**
 * @brief This function creates a dictionary of transitions action;
 * @param transitions - array of transitions;
 * @returns Returns a dictionary of transitions action.
 */
function getActions(transitions: TTransitionsArray): TActionsStructure {
	const actions: TActionsStructure = [];
	for (let i = 0; i < transitions.length; i++) {
		const from = transitions[i][0];
		const to = transitions[i][1];
		let id = transitions[i][2];
		if (id === '') {
			id = generateIdForAnonymousAction(from, to, i);
		}
		const action: TAction = {
			from,
			to,
			id,
		};
		actions.push(action);
	}
	return actions;
}

/**
 * @brief The main function that collects all the information and processes it;
 * @param diagramText - diagram [string];
 * @returns Returns dictionary with information from the diagram.
 */
export async function parseStateDiagram(
	diagramText: string,
): Promise<TStateDiagramStructure> {
	const parsedDiagram: TParsedDiagramArray = await diagramParser(diagramText);
	const transitions: TTransitionsArray = getTransitions(parsedDiagram);
	const stateDiagramStructure: TStateDiagramStructure = {
		states: getStates(parsedDiagram, transitions),
		actions: getActions(transitions),
		notes: getNotes(parsedDiagram),
		choices: getChoices(parsedDiagram),
		forks: getForks(parsedDiagram),
	};
	return stateDiagramStructure;
}
