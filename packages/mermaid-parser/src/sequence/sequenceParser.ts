import mermaid from 'mermaid';
import {
	messagesDict,
	actorsArray,
	sequenceMermaidGraphDict,
	notesDict,
    parsedMessagesArray,
    parsedDiagramTuple
} from './types/index.js';



/**
 * @brief Function that parses a diagram;
 * @param diagramText - diagram;
 * @returns Returns parsed diagram dictionary.
 */
async function diagramParser(diagramText: string): Promise<parsedDiagramTuple> {
    mermaid.mermaidAPI.setConfig({ ...mermaid.mermaidAPI.defaultConfig });
    await mermaid.mermaidAPI.initialize();
    const diagram = await mermaid.mermaidAPI.getDiagramFromText(diagramText);

    const parsedMessages: parsedMessagesArray = diagram.db.getMessages();
    const parsedActors: actorsArray = diagram.db.getActorKeys();

    //const actors = diagram.db.getActors();
    //const boxes = diagram.db.getBoxes();
    //const title = diagram.db.getDiagramTitle();
    //const hasBoxes = diagram.db.hasAtLeastOneBox();
    //const hasBoxTitles = diagram.db.hasAtLeastOneBoxWithTitle();
    //const accTitle = diagram.db.getAccTitle();
    //const description = diagram.db.getAccDescription();
    //const seqNumbers = diagram.db.showSequenceNumbers();
    //const cnf = diagram.db.getConfig();

    const parsedDiagram: parsedDiagramTuple = [parsedMessages, parsedActors]
    return parsedDiagram;
}

/**
 * @brief This function creates a dictionary of messages links;
 * @param messages - array of sequence messages;
 * @param actors - array of diagram actors and participants;
 * @returns Returns a dictionary of messages links.
 */
function getMessages(messages: parsedMessagesArray, actors: actorsArray): messagesDict {
    const actions: messagesDict = {};

	for (let i = 0; i < actors.length; i++) {
		const elementI = actors[i];
		actions[elementI] = {};
		for (let j = 0; j < actors.length; j++) {
			const elementJ = actors[j];
			actions[elementI][elementJ] = null;
		}
	}

    const arrowTypes = [0, 1, 3, 4, 5, 6, 24, 25];
    for (let i = 0; i < messages.length; i++) {
        if(arrowTypes.indexOf(messages[i].type) !== -1) {
            const arrowMessage = messages[i].message as string;

            const from = messages[i].from as string;
            const to = messages[i].to as string;


            if (actions[from][to] === null) {
                actions[from][to] = [arrowMessage];
            } else {
                actions[from][to]?.push(arrowMessage);
            }
        }
    }

    return actions
}

/**
 * @brief A function that extracts notes from the sequence diagram;
 * @param messages - array of sequence messages;
 * @param actors - array of diagram actors and participants;
 * @returns Returns a dictionary of notes from the sequence diagram.
 */
function getNotes(messages: parsedMessagesArray, actors: actorsArray): notesDict {
    const notes: notesDict = {};

	for (let i = 0; i < actors.length; i++) {
		const elementI = actors[i];
		notes[elementI] = null;
	}

    for (let i = 0; i < messages.length; i++) {
        if(messages[i].type === 2) {
            const recievedMessage = messages[i].message as string;

            let from_index = actors.indexOf(messages[i].from as string);
            const to_index = actors.indexOf(messages[i].to as string);

            while(from_index !== to_index + 1) {
                const from = actors[from_index];

                if(notes[from] === null) {
                    notes[from] = [recievedMessage];
                }
                else {
                    notes[from]?.push(recievedMessage);
                }

                from_index++;
            }
        }
    }
    return notes
}

/**
 * @brief A function that builds a dictionary with information from the diagram;
 * @param parsedDiagram - a primary diagram dictionary;
 * @returns Returns dictionary with information from the diagram.
 */
function markGraph(parsedDiagram: parsedDiagramTuple): sequenceMermaidGraphDict {
    const messages: parsedMessagesArray = parsedDiagram[0];
    const actorsArray: actorsArray = parsedDiagram[1];

    const mermaidGraph: sequenceMermaidGraphDict = {
        messages: getMessages(messages, actorsArray),
        notes: getNotes(messages, actorsArray),
        actors: actorsArray,
        susDirections: []
    }

    return mermaidGraph
}

/**
 * @brief The main function that collects all the information and processes it;
 * @param diagramText - diagram [string];
 * @returns Returns dictionary with information from the diagram.
 */
export async function parseSequenceDiagram(
	diagramText: string
): Promise<sequenceMermaidGraphDict> {
	const parsedDiagram: parsedDiagramTuple = await diagramParser(diagramText);
    const sequenceMermaidGraph: sequenceMermaidGraphDict = markGraph(parsedDiagram);

	return sequenceMermaidGraph;
}