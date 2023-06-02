import mermaid from 'mermaid';
import {
	actionDict,
	diagramElementsArray,
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

    const messages: any = diagram.db.getMessages();
    const actorKeys: diagramElementsArray = diagram.db.getActorKeys();

    //const actors = diagram.db.getActors();
    //const boxes = diagram.db.getBoxes();
    //const title = diagram.db.getDiagramTitle();
    //const hasBoxes = diagram.db.hasAtLeastOneBox();
    //const hasBoxTitles = diagram.db.hasAtLeastOneBoxWithTitle();
    //const accTitle = diagram.db.getAccTitle();
    //const description = diagram.db.getAccDescription();
    //const seqNumbers = diagram.db.showSequenceNumbers();
    //const cnf = diagram.db.getConfig();


    const parsedDiagram = [messages, actorKeys]
    return parsedDiagram;
}

/**
 * @brief This function creates a dictionary of action links;
 * @param messages - array of sequence steps;
 * @param diagramElements - array of diagram elements [diagramElementsArray];
 * @returns Returns a dictionary of action links [actionDict].
 */
function getActions(messages: any, diagramElements: diagramElementsArray): actionDict {
    const actions: actionDict = {};

	for (let i = 0; i < diagramElements.length; i++) {
		const elementI = diagramElements[i];
		actions[elementI] = {};
		for (let j = 0; j < diagramElements.length; j++) {
			const elementJ = diagramElements[j];
			actions[elementI][elementJ] = null;
		}
	}

    const arrowTypes = [0, 1, 3, 4, 5, 6, 24, 25];
    for (let i = 0; i < messages.length; i++) {
        if(arrowTypes.indexOf(messages[i].type) !== -1) {
            const arrowMessage = messages[i].message;
            const from = messages[i].from;
            const to = messages[i].to;

            if (actions[from][to] === null) {
                actions[from][to] = [arrowMessage];
            } else {
                //@ts-ignore
                actions[from][to].push(arrowMessage);
            }
        }
    }

    return actions
}

/**
 * @brief A function that extracts notes from the sequence diagram;
 * @param messages - array of sequence steps;
 * @param diagramElements - array of diagram elements [diagramElementsArray];
 * @returns Returns a dictionary of notes from the sequence diagram [noteDict].
 */
function getNotes(messages: any, diagramElements: diagramElementsArray): noteDict {
    const notes: noteDict = {};

	for (let i = 0; i < diagramElements.length; i++) {
		const elementI = diagramElements[i];
		notes[elementI] = null;
	}

    for (let i = 0; i < messages.length; i++) {
        if(messages[i].type === 2) {
            const recievedMessage = messages[i].message;
            let from_index = diagramElements.indexOf(messages[i].from);
            const to_index = diagramElements.indexOf(messages[i].to);

            while(from_index !== to_index + 1) {
                const from = diagramElements[from_index];

                if(notes[from] === null) {
                    notes[from] = [recievedMessage];
                }
                else {
                    //@ts-ignore
                    notes[from].push(recievedMessage);
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
 * @returns Returns dictionary with information from the diagram [mermaidGraphDict].
 */
function markGraph(parsedDiagram: any): mermaidGraphDict {
    const messages = parsedDiagram[0];
    const diagramElements: diagramElementsArray = parsedDiagram[1];

    const mermaidGraph: mermaidGraphDict = {
        actions: getActions(messages, diagramElements),
        notes: getNotes(messages, diagramElements),
        states: diagramElements,
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
): Promise<mermaidGraphDict> {
	const parsedDiagram: any = await diagramParser(diagramText);
    const sequenceMermaidGraph: mermaidGraphDict = markGraph(parsedDiagram);

	return sequenceMermaidGraph;
}