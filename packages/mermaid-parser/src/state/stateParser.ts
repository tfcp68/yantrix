import mermaid from 'mermaid';
import {
	actionDict,
	diagramElementsArray,
	directionsArray,
	mermaidGraphDict,
	noteDict,
} from './types/index.js';

/**
 * @brief Function that parses a diagram;
 * @param diagramText - diagram [string];
 * @returns Returns parsed diagram dictionary.
 */
async function diagramParser(diagramText: string): Promise<any> {
	mermaid.mermaidAPI.setConfig({ ...mermaid.mermaidAPI.defaultConfig });
	await mermaid.mermaidAPI.initialize();
	const diagram = await mermaid.mermaidAPI.getDiagramFromText(diagramText);
	const parsedDiagram = diagram.db.getRootDoc();

	return parsedDiagram;
}

/**
 * @brief This function collects directions from a diagram;
 * @param parsedDiagram - a primary diagram dictionary;
 * @returns Returns the directions from the diagram and their descriptions [directionsArray].
 */
function getDirections(parsedDiagram: any): directionsArray {
	const directions: directionsArray = [];

	for (let i = 0; i < parsedDiagram.length; i++) {
		if (parsedDiagram[i].stmt === 'relation') {
			const directionI: string[] = [];
			const st1 = parsedDiagram[i].state1.id;
			const st2 = parsedDiagram[i].state2.id;

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
				const descr = parsedDiagram[i].description;
				directionI.push(descr);
			} else {
				directionI.push('');
			}

			directions.push(directionI);
		}
	}

	return directions;
}

/**
 * @brief This function collects the elements that are in the mermaid state diagram;
 * @param directions - array of directions [DirectionsArray];
 * @returns Returns an array of diagram elements [diagramElementsArray].
 */
function getDiagramElements(directions: directionsArray): diagramElementsArray {
	const diagramElements: diagramElementsArray = [];

	for (let i = 0; i < directions.length; i++) {
		for (let j = 0; j < 2; j++) {
			const element = directions[i][j];
			if (!diagramElements.includes(element)) {
				diagramElements.push(element);
			}
		}
	}

	return diagramElements;
}

/**
 * @brief This function creates a dictionary of action links;
 * @param directions - array of directions [DirectionsArray];
 * @param diagramElements - array of diagram elements [diagramElementsArray];
 * @returns Returns a dictionary of action links [actionDict].
 */
function getActions(
	directions: directionsArray,
	diagramElements: diagramElementsArray
): actionDict {
	const actions: actionDict = {};

	for (let i = 0; i < diagramElements.length; i++) {
		const elementI = diagramElements[i];
		actions[elementI] = {};
		for (let j = 0; j < diagramElements.length; j++) {
			const elementJ = diagramElements[j];
			actions[elementI][elementJ] = null;
		}
	}

	for (let i = 0; i < directions.length; i++) {
		const pairOfElements = directions[i];
		const from = pairOfElements[0];
		const to = pairOfElements[1];
		const description = pairOfElements[2];

		if (actions[from][to] === null) {
			actions[from][to] = [description];
		} else {
			//@ts-ignore
			actions[from][to].push(description);
		}
	}

	return actions;
}

/**
 * @brief A function that extracts notes from the state diagram;
 * @param parsedDiagram - a primary diagram dictionary;
 * @param diagramElements - array of diagram elements [string[]];
 * @returns Returns a dictionary of notes from the state diagram [noteDict].
 */
function getNotes(
	parsedDiagram: any,
	diagramElements: diagramElementsArray
): noteDict {
	const notes: noteDict = {};

	for (let i = 0; i < diagramElements.length; i++) {
		const elementI = diagramElements[i];
		notes[elementI] = null;
	}

	for (let i = 0; i < parsedDiagram.length; i++) {
		if (parsedDiagram[i].stmt === 'state') {
			const keys = Object.keys(parsedDiagram[i]);

			if (keys.includes('note')) {
				const noteKeys = Object.keys(parsedDiagram[i].note);

				if (noteKeys.includes('text')) {
					const from: string = parsedDiagram[i].id;
					const noteText: string = parsedDiagram[i].note.text;

					if (notes[from] === null) {
						notes[from] = [noteText];
					} else {
						//@ts-ignore
						notes[from].push(noteText);
					}
				}
			}
		}
	}

	return notes;
}

/**
 * @brief A function that collects suspicious action links without description;
 * @param directions - array of directions [directionsArray];
 * @returns Returns array with suspicious action links without description [any[]];
 */
function findSusDirections(directions: directionsArray): directionsArray {
	const susDirections: directionsArray = [];

	for (let i = 0; i < directions.length; i++) {
		if (directions[i][2] === '') {
			susDirections.push(directions[i]);
		}
	}
	return susDirections;
}

/**
 * @brief A function that finds "fork (choice) elements";
 * @param parsedDiagram - a primary diagram dictionary;
 * @returns Returns array with "fork (choice) elements" [string[]];
 */
function findChoices(parsedDiagram: any): string[] {
	const choices: string[] = [];

	for (let i = 0; i < parsedDiagram.length; i++) {
		if (parsedDiagram[i].stmt === 'state') {
			const keys = Object.keys(parsedDiagram[i]);
			if (keys.includes('type')) {
				const stateType = parsedDiagram[i].type;

				if (stateType === 'choice') {
					const choiceElement = parsedDiagram[i].id;
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
 * @param directions - array of directions [DirectionsArray];
 * @param mermaidGraph - main dictionary with information from the diagram;
 * @returns Returns updated "mermaid-graph".
 */
function markChoices(
	parsedDiagram: any,
	directions: directionsArray,
	mermaidGraph: mermaidGraphDict
) {
	const choices = findChoices(parsedDiagram);

	for (let k = 0; k < choices.length; k++) {
		const choice: string = choices[k];

		const branch = mermaidGraph['actions'][choice];
		for (let i = 0; i < directions.length; i++) {
			const toChoice = directions[i][1];

			if (toChoice === choice) {
				const from = directions[i][0];
				const choiceDescription = directions[i][2];

				for (const to in mermaidGraph['actions'][from]) {
					if (branch[to] !== null) {
						if (mermaidGraph['actions'][from][to] === null) {
							//mermaidGraph['actions'][from][to] = branch[to]
							mermaidGraph['actions'][from][to] = [
								choiceDescription,
							];
						} else {
							mermaidGraph['actions'][from][to] = (
								mermaidGraph['actions'][from][to] || []
							).concat(choiceDescription);
						}
					}
				}
			}
		}
	}

	return mermaidGraph;
}

/**
 * @brief A function that builds a dictionary with information from the diagram;
 * @param parsedDiagram - a primary diagram dictionary;
 * @param directions - array of directions [DirectionsArray];
 * @param diagramElements - array of diagram elements [diagramElementsArray];
 * @returns Returns dictionary with information from the diagram [mermaidGraphDict].
 */
function markGraph(
	parsedDiagram: any,
	directions: directionsArray,
	diagramElements: diagramElementsArray
): mermaidGraphDict {
	const mermaidGraph: mermaidGraphDict = {
		actions: getActions(directions, diagramElements),
		notes: getNotes(parsedDiagram, diagramElements),
		states: diagramElements,
		susDirections: findSusDirections(directions),
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
): Promise<mermaidGraphDict> {
	const parsedDiagram: any = await diagramParser(diagramText);
	const directions: directionsArray = getDirections(parsedDiagram);
	const diagramElements: diagramElementsArray =
		getDiagramElements(directions);
	let stateMermaidGraph: mermaidGraphDict = markGraph(
		parsedDiagram,
		directions,
		diagramElements
	);
	stateMermaidGraph = markChoices(
		parsedDiagram,
		directions,
		stateMermaidGraph
	);
	return stateMermaidGraph;
}
