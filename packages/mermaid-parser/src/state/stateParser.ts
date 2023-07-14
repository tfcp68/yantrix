import mermaid from 'mermaid';
import {
	TActionDict,
	TDiagramStatesArray,
	TTransitionsArray,
	TAction,
	TAnonymousTransitionsArray,
	TStateGraph,
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

	for (let i = 0; i < transitions.length; i++) {
		const pairOfElements = transitions[i];
		const from = pairOfElements[0];
		const to = pairOfElements[1];
		const action = pairOfElements[2];

		if (!Object.keys(actions).includes(from)) {
			actions[from] = {}
		}
		if (!Object.keys(actions[from]).includes(to)) {
			actions[from][to] = {
				note: [action],
				transition: []
			}
		}
		else {
			actions[from][to].note.push(action)
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

	for (let i = 0; i < parsedDiagram.length; i++) {
		if (parsedDiagram[i].stmt === 'state') {
			const keys = Object.keys(parsedDiagram[i]);

			if (keys.includes('note')) {
				const noteKeys = Object.keys(parsedDiagram[i].note);

				if (noteKeys.includes('text')) {
					const from: string = parsedDiagram[i].id as string;
					const parsedDiagramNote: Record<string, string> = parsedDiagram[i].note as Record<string, string>
					const noteText: string = parsedDiagramNote.text;

					if (!Object.keys(notes).includes(from)) {
						notes[from] = [noteText];
					} else {
						notes[from].push(noteText);
					}
				}
			}
		}
	}

	return notes;
}

/**
 * @brief A function that collects anonymous transitions without actions;
 * @param transitions - array of transitions;
 * @returns Returns array with anonymous transitions without actions;
 */
function findAnonymousTransitions(transitions: TTransitionsArray): TAnonymousTransitionsArray {
	const anonymousTransitions: TAnonymousTransitionsArray = [];

	for (let i = 0; i < transitions.length; i++) {
		if (transitions[i][2] === '') {
			const from_i = transitions[i][0]
			const to_i = transitions[i][1]
			const anonymousTransition = {
				from: from_i,
				to: to_i
			}
			anonymousTransitions.push(anonymousTransition);
		}
	}
	return anonymousTransitions;
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
 * @param stateGraph - main dictionary with information from the diagram;
 * @returns Returns updated "stateGraph".
 */
function markChoices(
	parsedDiagram: TParsedDiagramArray,
	transitions: TTransitionsArray,
	stateGraph: TStateGraph
): TStateGraph {
	const choices: TChoices = findChoices(parsedDiagram);

	for (const choice of choices) {
		const delIndex = stateGraph['states'].indexOf(choice);
		stateGraph['states'].splice(delIndex, 1)


		const toChoice: Record<string, TAction> = {}

		// find fromChoice
		const fromChoice: Record<string, TAction> = stateGraph['actions'][choice]
		delete stateGraph['actions'][choice]

		// find toChoice
		const actionKeys = Object.keys(stateGraph['actions'])
		for (let i = 0; i < actionKeys.length; i++) {
			const key = actionKeys[i]

			const value = stateGraph['actions'][key]
			if(Object.keys(value).includes(choice)) {
				toChoice[key] = value[choice]
				delete stateGraph['actions'][key][choice]
			}	
		}

		const toChoiceKeys = Object.keys(toChoice)
		for	(let i = 0; i < toChoiceKeys.length; i++) {
			const from = toChoiceKeys[i]
			const fromChoiceKeys = Object.keys(fromChoice)
			for (let j = 0; j < fromChoiceKeys.length; j++) {
				const to = fromChoiceKeys[j]
				const fromValue: TAction = toChoice[from]
				const toValue: TAction = fromChoice[to]
				
				for (const fromValueI of fromValue.note) {
					for (const toValueI of toValue.note) {
						const value = (fromValueI+" "+ toValueI).trim()
						
						if (!Object.keys(stateGraph['actions'][from]).includes(to)) {
							stateGraph['actions'][from][to] = {
								note: [value],
								transition: []
							}
						}
						else {
							stateGraph['actions'][from][to].note.push(value)
						}
					}
				}
				
			}
		}
	}

	return stateGraph;
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
): TStateGraph {
	const stateGraph: TStateGraph = {
		actions: getActions(transitions, diagramStates),
		notes: getNotes(parsedDiagram, diagramStates),
		states: diagramStates,
		anonymousTransitions: findAnonymousTransitions(transitions),
	};

	return stateGraph;
}

/**
 * @brief The main function that collects all the information and processes it;
 * @param diagramText - diagram [string];
 * @returns Returns dictionary with information from the diagram.
 */
export async function parseStateDiagram(diagramText: string): Promise<TStateGraph> {
	const parsedDiagram: TParsedDiagramArray = await diagramParser(diagramText);
	const transitions: TTransitionsArray = getTransitions(parsedDiagram);
	const diagramStates: TDiagramStatesArray = getStates(transitions);
	let stateGraph: TStateGraph = markGraph(parsedDiagram, transitions, diagramStates);
	
	stateGraph = markChoices(
		parsedDiagram,
		transitions,
		stateGraph
	);
	
	return stateGraph;
}