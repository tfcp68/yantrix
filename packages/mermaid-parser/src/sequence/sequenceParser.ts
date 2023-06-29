import mermaid from 'mermaid';
import {
	TMessagesDict,
	TActorsArray,
	TSequenceMermaidGraphDict,
	TNotesDict,
    TParsedMessagesArray,
    TParsedDiagramTuple,
    TParsedNotesArray,
    TParsedOtherElementsArray,
    TActivateDict,
    TSeqTypes,
    arrowTypes
} from './types/index.js';


/**
 * @brief Function that parses a diagram;
 * @param diagramText - diagram;
 * @returns Returns parsed diagram dictionary.
 */
async function diagramParser(diagramText: string): Promise<TParsedDiagramTuple> {
    mermaid.mermaidAPI.setConfig({ ...mermaid.mermaidAPI.defaultConfig });
    await mermaid.mermaidAPI.initialize();
    const diagram = await mermaid.mermaidAPI.getDiagramFromText(diagramText);
    const parsedArray: any = diagram.db.getMessages();

    const parsedMessages: TParsedMessagesArray = []
    const parsedActors: TActorsArray = diagram.db.getActorKeys();
    const parsedNotes: TParsedNotesArray = []
    const parsedOtherElements: TParsedOtherElementsArray = []

    for (let i = 0; i < parsedArray.length; i++) {
        if(arrowTypes.indexOf(parsedArray[i].type) !== -1) {
            parsedMessages.push(parsedArray[i])
        }
        else if(parsedArray[i].type === TSeqTypes.Note) {
            parsedNotes.push(parsedArray[i])
        }
        else {
            if(parsedArray[i].from !== undefined) {
                parsedArray[i].from = parsedArray[i].from?.actor
            }
            parsedOtherElements.push(parsedArray[i])
        }
    }

    const parsedActivations: TActivateDict = getActivations(parsedArray, parsedActors)

    const parsedDiagram: TParsedDiagramTuple = [parsedMessages, parsedActors, parsedNotes, parsedOtherElements, parsedActivations]
    return parsedDiagram;
}

/**
 * @brief This function creates a dictionary of messages links;
 * @param parsedMessages - array of sequence messages;
 * @param actors - array of diagram actors and participants;
 * @returns Returns a dictionary of messages links.
 */
function getMessages(parsedMessages: TParsedMessagesArray, actors: TActorsArray): TMessagesDict {
    const messages: TMessagesDict = {};

	for (let i = 0; i < actors.length; i++) {
		const elementI = actors[i];
		messages[elementI] = {};
		for (let j = 0; j < actors.length; j++) {
			const elementJ = actors[j];
			messages[elementI][elementJ] = null;
		}
	}

    for (let i = 0; i < parsedMessages.length; i++) {
        const arrowMessage = parsedMessages[i].message;
        const from = parsedMessages[i].from;
        const to = parsedMessages[i].to;

        if (messages[from][to] === null) {
            messages[from][to] = [arrowMessage];
        } else {
            messages[from][to]?.push(arrowMessage);
        }
    }
    return messages
}

/**
 * @brief A function that extracts notes from the sequence diagram;
 * @param parsedMessages - array of sequence messages;
 * @param actors - array of diagram actors and participants;
 * @returns Returns a dictionary of notes from the sequence diagram.
 */
function getNotes(parsedMessages: TParsedMessagesArray, actors: TActorsArray): TNotesDict {
    const notes: TNotesDict = {};

	for (let i = 0; i < actors.length; i++) {
		const elementI = actors[i];
		notes[elementI] = null;
	}

    for (let i = 0; i < parsedMessages.length; i++) {
        const recievedMessage = parsedMessages[i].message;
        let from_index = actors.indexOf(parsedMessages[i].from);
        const to_index = actors.indexOf(parsedMessages[i].to);

        while(from_index !== to_index + 1) {
            const from = actors[from_index];

            if(notes[from] === null) {
                notes[from] = [recievedMessage];
            } else {
                notes[from]?.push(recievedMessage);
            }
            from_index++;
        }
    }
    return notes
}

/**
 * @brief A function that collect messages that are located in the activation interval;
 * @param parsedArray - parsed diagram array;
 * @param actors - array of diagram actors and participants;
 * @returns Returns a dictionary of activation messages from the sequence diagram.
 */
function getActivations(parsedArray: any, actors: TActorsArray): TActivateDict {
    const activate: TActivateDict = {}
    for (let i = 0; i < actors.length; i++) {
		const elementI = actors[i];
		activate[elementI] = [];
	}

    for(let i = 0; i < parsedArray.length; i++) {
        if(parsedArray[i].type === TSeqTypes.Activate) {
            const currentActor: string = parsedArray[i].from
            activate[currentActor].push([])
            const len = activate[currentActor].length - 1;
            for(let j = i-1; j < parsedArray.length; j++) {
                if(arrowTypes.indexOf(parsedArray[j].type) !== -1 && parsedArray[j].from === currentActor) {
                    activate[currentActor][len].push(parsedArray[j].message);
                }
                else if(parsedArray[j].type === TSeqTypes.Deactivate && parsedArray[j].from === currentActor) {
                    break;
                }
            }
        }
    }

    return activate
}
/**
 * @brief A function that builds a dictionary with information from the diagram;
 * @param parsedDiagram - a primary diagram dictionary;
 * @returns Returns dictionary with information from the diagram.
 */
function markGraph(parsedDiagram: TParsedDiagramTuple): TSequenceMermaidGraphDict {
    const messagesArray: TParsedMessagesArray = parsedDiagram[0];
    const actorsArray: TActorsArray = parsedDiagram[1];
    const notesArray: TParsedNotesArray = parsedDiagram[2];
    const othersElementsArray: TParsedOtherElementsArray = parsedDiagram[3];
    const activateDict: TActivateDict = parsedDiagram[4];

    const mermaidGraph: TSequenceMermaidGraphDict = {
        messages: getMessages(messagesArray, actorsArray),
        notes: getNotes(notesArray, actorsArray),
        actors: actorsArray,
        activate: activateDict
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
): Promise<TSequenceMermaidGraphDict> {
	const parsedDiagram: TParsedDiagramTuple = await diagramParser(diagramText);
    const sequenceMermaidGraph: TSequenceMermaidGraphDict = markGraph(parsedDiagram);

	return sequenceMermaidGraph;
}