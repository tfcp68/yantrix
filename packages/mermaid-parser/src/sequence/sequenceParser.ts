import mermaid from 'mermaid';
import { BlankInputError, InvalidInputError } from './errors/sequenceErrors.js';
import {
	arrowTypes,
	TActivationsDict,
	TActorsArray,
	TMessagesDict,
	TNotesDict,
	TParsedDiagramDict,
	TParsedMessagesArray,
	TParsedNotesArray,
	TParsedOtherElementsArray,
	TSeqTypes,
	TSequenceMermaidGraphDict,
} from './types/index.js';

/**
 * @brief Function that parses a diagram;
 * @param diagramText - diagram;
 * @returns Returns parsed diagram dictionary.
 */
async function diagramParser(diagramText: string): Promise<TParsedDiagramDict> {
	if (diagramText === '') {
		throw new BlankInputError();
	}
	try {
		mermaid.mermaidAPI.setConfig({ ...mermaid.mermaidAPI.defaultConfig });
		await mermaid.mermaidAPI.initialize();
		const diagram = await mermaid.mermaidAPI.getDiagramFromText(
			diagramText,
		);

		// @ts-expect-error IMPLEMENTATION BUG
		const parsedArray: any = diagram.db.getMessages();

		const parsedMessages: TParsedMessagesArray = [];

		// @ts-expect-error IMPLEMENTATION BUG
		const parsedActors: TActorsArray = diagram.db.getActorKeys();
		const parsedNotes: TParsedNotesArray = [];
		const parsedOtherElements: TParsedOtherElementsArray = [];

		for (let i = 0; i < parsedArray.length; i++) {
			if (arrowTypes.includes(parsedArray[i].type)) {
				parsedMessages.push(parsedArray[i]);
			} else if (parsedArray[i].type === TSeqTypes.Note) {
				parsedNotes.push(parsedArray[i]);
			} else {
				parsedOtherElements.push(parsedArray[i]);
			}
		}

		const parsedActivations: TActivationsDict = getActivations(
			parsedArray,
			parsedActors,
		);

		const parsedDiagram: TParsedDiagramDict = {
			messages: parsedMessages,
			actors: parsedActors,
			notes: parsedNotes,
			others: parsedOtherElements,
			activations: parsedActivations,
		};
		return parsedDiagram;
	} catch (e) {
		if (e instanceof Error) {
			if (e.name === 'Diagram SequenceDiagram already registered.') {
				mermaid.mermaidAPI.reset();
				return diagramParser(diagramText);
			}
		}

		throw new InvalidInputError((e as Error).message);
	}
}

/**
 * @brief This function creates a dictionary of messages links;
 * @param parsedMessages - array of sequence messages;
 * @param actors - array of diagram actors and participants;
 * @returns Returns a dictionary of messages links.
 */
function getMessages(
	parsedMessages: TParsedMessagesArray,
	actors: TActorsArray,
): TMessagesDict {
	const messages: TMessagesDict = {};

	for (let i = 0; i < actors.length; i++) {
		const elementI = actors[i];
		if (!elementI)
			continue;

		messages[elementI] = {};
		for (let j = 0; j < actors.length; j++) {
			const elementJ = actors[j];
			if (!elementJ)
				continue;

			messages[elementI][elementJ] = null;
		}
	}

	for (let i = 0; i < parsedMessages.length; i++) {
		const parsed = parsedMessages[i];
		if (!parsed)
			continue;

		const arrowMessage = parsed.message;
		const from = parsed.from;
		const to = parsed.to;

		if (messages[from]?.[to] === null) {
			messages[from][to] = [arrowMessage];
		} else {
			messages[from]?.[to]?.push(arrowMessage);
		}
	}
	return messages;
}

/**
 * @brief A function that extracts notes from the sequence diagram;
 * @param parsedMessages - array of sequence messages;
 * @param actors - array of diagram actors and participants;
 * @returns Returns a dictionary of notes from the sequence diagram.
 */
function getNotes(
	parsedMessages: TParsedMessagesArray,
	actors: TActorsArray,
): TNotesDict {
	const notes: TNotesDict = {};

	for (let i = 0; i < actors.length; i++) {
		const elementI = actors[i];
		if (!elementI)
			continue;

		notes[elementI] = null;
	}

	for (let i = 0; i < parsedMessages.length; i++) {
		const parsed = parsedMessages[i];
		if (!parsed)
			continue;

		const recievedMessage = parsed.message;
		let fromIndex = actors.indexOf(parsed.from);
		const toIndex = actors.indexOf(parsed.to);

		while (fromIndex !== toIndex + 1) {
			const from = actors[fromIndex];
			if (!from)
				continue;

			if (notes[from] === null) {
				notes[from] = [recievedMessage];
			} else {
				notes[from]?.push(recievedMessage);
			}
			fromIndex++;
		}
	}
	return notes;
}

/**
 * @brief A function that collect messages that are located in the activation interval;
 * @param parsedArray - parsed diagram array;
 * @param actors - array of diagram actors and participants;
 * @returns Returns a dictionary of activation messages from the sequence diagram.
 */
function getActivations(
	parsedArray: any,
	actors: TActorsArray,
): TActivationsDict {
	const activate: TActivationsDict = {};
	for (let i = 0; i < actors.length; i++) {
		const elementI = actors[i];
		if (!elementI)
			continue;

		activate[elementI] = [];
	}

	for (let i = 0; i < parsedArray.length; i++) {
		if (parsedArray[i].type === TSeqTypes.Activate) {
			const currentActor: string = parsedArray[i].from;
			activate[currentActor]?.push([]);
			const len = activate[currentActor]!.length - 1;
			for (let j = i - 1; j < parsedArray.length; j++) {
				if (arrowTypes.includes(parsedArray[j].type)
					&& parsedArray[j].from === currentActor) {
					activate[currentActor]![len]?.push(parsedArray[j].message);
				} else if (parsedArray[j].type === TSeqTypes.Deactivate
					&& parsedArray[j].from === currentActor) {
					parsedArray[j].type = -1;
					break;
				}
			}
		}
	}

	return activate;
}
/**
 * @brief A function that builds a dictionary with information from the diagram;
 * @param parsedDiagram - a primary diagram dictionary;
 * @returns Returns dictionary with information from the diagram.
 */
function markGraph(
	parsedDiagram: TParsedDiagramDict,
): TSequenceMermaidGraphDict {
	const messagesArray: TParsedMessagesArray = parsedDiagram.messages;
	const actorsArray: TActorsArray = parsedDiagram.actors;
	const notesArray: TParsedNotesArray = parsedDiagram.notes;
	// const othersElementsArray: TParsedOtherElementsArray = parsedDiagram['others'];
	const activateDict: TActivationsDict = parsedDiagram.activations;

	const mermaidGraph: TSequenceMermaidGraphDict = {
		messages: getMessages(messagesArray, actorsArray),
		notes: getNotes(notesArray, actorsArray),
		actors: actorsArray,
		activations: activateDict,
	};

	return mermaidGraph;
}

/**
 * The main function that collects all the information from the Mermaid diagram and transforms it
 * into a form appropriate for processing with other parts of the Yantrix toolkit.
 *
 * @param diagramText - Text of the diagram written in accordance with Mermaid syntax.
 * @returns Dictionary that contains information from the diagram for further processing.
 */
export async function parseSequenceDiagram(
	diagramText: string,
): Promise<TSequenceMermaidGraphDict> {
	const parsedDiagram: TParsedDiagramDict = await diagramParser(diagramText);
	const sequenceMermaidGraph: TSequenceMermaidGraphDict = markGraph(
		parsedDiagram,
	);

	return sequenceMermaidGraph;
}
