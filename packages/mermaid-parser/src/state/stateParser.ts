import mermaid from 'mermaid';
import {
	TActionDict,
	TDiagramStatesArray,
	TTransitionsArray,
	TStateMermaidGraphDict,
	TNoteDict,
	TChoices,
	TParsedDiagramArray
} from './types/index.js';

/**
 * @brief Function that parses a diagram;
 * @param diagramText - diagram [string];
 * @returns Returns parsed diagram dictionary.
 */
async function diagramParser(diagramText: string): Promise<TParsedDiagramArray> {
	mermaid.mermaidAPI.setConfig({ ...mermaid.mermaidAPI.defaultConfig });
	await mermaid.mermaidAPI.initialize();
	const diagram = await mermaid.mermaidAPI.getDiagramFromText(diagramText);
	const parsedDiagram: TParsedDiagramArray = diagram.db.getRootDoc();

	return parsedDiagram;
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
			const temp_st1: Record<string, string> = parsedDiagram[i].state1 as Record<string, string>
			const temp_st2: Record<string, string> = parsedDiagram[i].state2 as Record<string, string>
			const st1: string = temp_st1.id;
			const st2: string = temp_st2.id;

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
 * @brief This function collects the elements that are in the mermaid state diagram;
 * @param transitions - array of transitions;
 * @returns Returns an array of diagram elements.
 */
function getStates(transitions: TTransitionsArray): TDiagramStatesArray {
	const diagramStates: TDiagramStatesArray = [];

	for (let i = 0; i < transitions.length; i++) {
		for (let j = 0; j < 2; j++) {
			const element = transitions[i][j];
			if (!diagramStates.includes(element)) {
				diagramStates.push(element);
			}
		}
	}

	return diagramStates;
}

/**
 * @brief This function creates a dictionary of transitions action;
 * @param transitions - array of transitions;
 * @param diagramStates - array of diagram elements;
 * @returns Returns a dictionary of transitions action.
 */
function getActions(
	transitions: TTransitionsArray,
	diagramStates: TDiagramStatesArray
): TActionDict {
	const actions: TActionDict = {};

	for (let i = 0; i < diagramStates.length; i++) {
		const elementI = diagramStates[i];
		actions[elementI] = {};
		for (let j = 0; j < diagramStates.length; j++) {
			const elementJ = diagramStates[j];
			actions[elementI][elementJ] = null;
		}
	}

	for (let i = 0; i < transitions.length; i++) {
		const pairOfElements = transitions[i];
		const from = pairOfElements[0];
		const to = pairOfElements[1];
		const action = pairOfElements[2];

		if (actions[from][to] === null) {
			actions[from][to] = [action];
		} else {
			actions[from][to]?.push(action);
		}
	}

	return actions;
}

/**
 * @brief A function that extracts notes from the state diagram;
 * @param parsedDiagram - a primary diagram dictionary;
 * @param diagramStates - array of diagram elements;
 * @returns Returns a dictionary of notes from the state diagram.
 */
function getNotes(
	parsedDiagram: TParsedDiagramArray,
	diagramStates: TDiagramStatesArray
): TNoteDict {
	const notes: TNoteDict = {};

	for (let i = 0; i < diagramStates.length; i++) {
		const elementI = diagramStates[i];
		notes[elementI] = null;
	}

	for (let i = 0; i < parsedDiagram.length; i++) {
		if (parsedDiagram[i].stmt === 'state') {
			const keys = Object.keys(parsedDiagram[i]);

			if (keys.includes('note')) {
				const noteKeys = Object.keys(parsedDiagram[i].note);

				if (noteKeys.includes('text')) {
					const from: string = parsedDiagram[i].id as string;
					const parsedDiagramNote: Record<string, string> = parsedDiagram[i].note as Record<string, string>
					const noteText: string = parsedDiagramNote.text;

					if (notes[from] === null) {
						notes[from] = [noteText];
					} else {
						notes[from]?.push(noteText);
					}
				}
			}
		}
	}

	return notes;
}

/**
 * @brief A function that collects suspicious transitions without actions;
 * @param transitions - array of transitions;
 * @returns Returns array with suspicious transitions without actions;
 */
function findSusTransitions(transitions: TTransitionsArray): TTransitionsArray {
	const susTransitions: TTransitionsArray = [];

	for (let i = 0; i < transitions.length; i++) {
		if (transitions[i][2] === '') {
			susTransitions.push(transitions[i]);
		}
	}
	return susTransitions;
}

/**
 * @brief A function that finds "fork (choice) elements";
 * @param parsedDiagram - a primary diagram dictionary;
 * @returns Returns array with "fork (choice) elements";
 */
function findChoices(parsedDiagram: TParsedDiagramArray): TChoices {
	const choices: TChoices = [];

	for (let i = 0; i < parsedDiagram.length; i++) {
		if (parsedDiagram[i].stmt === 'state') {
			const keys = Object.keys(parsedDiagram[i]);
			if (keys.includes('type')) {
				const stateType = parsedDiagram[i].type;

				if (stateType === 'choice') {
					const choiceElement = parsedDiagram[i].id as string;
					choices.push(choiceElement);
				}
			}
		}
	}

	return choices;
}

/**
 * @brief A function that complements the action links with descriptions from the "fork elements";
 * @param parsedDiagram - a primary diagram dictionary;
 * @param transitions - array of transitions;
 * @param stateMermaidGraph - main dictionary with information from the diagram;
 * @returns Returns updated "mermaid-graph".
 */
function markChoices(
	parsedDiagram: TParsedDiagramArray,
	transitions: TTransitionsArray,
	stateMermaidGraph: TStateMermaidGraphDict
): TStateMermaidGraphDict {
	const choices: TChoices = findChoices(parsedDiagram);

	for (let k = 0; k < choices.length; k++) {
		const choice: string = choices[k];

		const branch = stateMermaidGraph['actions'][choice];
		for (let i = 0; i < transitions.length; i++) {
			const toChoice = transitions[i][1];

			if (toChoice === choice) {
				const from = transitions[i][0];
				const choiceDescription = transitions[i][2];

				for (const to in stateMermaidGraph['actions'][from]) {
					if (branch[to] !== null) {
						if (stateMermaidGraph['actions'][from][to] === null) {
							stateMermaidGraph['actions'][from][to] = [
								choiceDescription,
							];
						} else {
							stateMermaidGraph['actions'][from][to] = (
								stateMermaidGraph['actions'][from][to] || []
							).concat(choiceDescription);
						}
					}
				}
			}
		}
	}

	return stateMermaidGraph;
}

/**
 * @brief A function that builds a dictionary with information from the diagram;
 * @param parsedDiagram - a primary diagram dictionary;
 * @param transitions - array of transitions;
 * @param diagramStates - array of diagram elements;
 * @returns Returns dictionary with information from the diagram.
 */
function markGraph(
	parsedDiagram: TParsedDiagramArray,
	transitions: TTransitionsArray,
	diagramStates: TDiagramStatesArray
): TStateMermaidGraphDict {
	const mermaidGraph: TStateMermaidGraphDict = {
		actions: getActions(transitions, diagramStates),
		notes: getNotes(parsedDiagram, diagramStates),
		states: diagramStates,
		susTransitions: findSusTransitions(transitions),
	};

	return mermaidGraph;
}

/**
 * @brief The main function that collects all the information and processes it;
 * @param diagramText - diagram [string];
 * @returns Returns dictionary with information from the diagram.
 */
export async function parseStateDiagram(
	diagramText: string
): Promise<TStateMermaidGraphDict> {
	const parsedDiagram: TParsedDiagramArray = await diagramParser(diagramText);
	const transitions: TTransitionsArray = getTransitions(parsedDiagram);
	const diagramStates: TDiagramStatesArray =
		getStates(transitions);
	let stateMermaidGraph: TStateMermaidGraphDict = markGraph(
		parsedDiagram,
		transitions,
		diagramStates
	);
	stateMermaidGraph = markChoices(
		parsedDiagram,
		transitions,
		stateMermaidGraph
	);
	return stateMermaidGraph;
}
