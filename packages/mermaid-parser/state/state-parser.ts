import mermaid from 'mermaid';
//import { DiagramDb } from "mermaid/dist/diagram-api/types.js";

type DirectionsArray = string[][]


async function diagramParser(diagramText: string) {
    /**
     * @brief Функция, которая парсит диаграмму
     * @param diagramText: строка диаграммы
     * @returns Возвращает promise словаря, который спарсили
     */
	mermaid.mermaidAPI.setConfig({...mermaid.mermaidAPI.defaultConfig});
	await mermaid.mermaidAPI.initialize();
	const diagram = await mermaid.mermaidAPI.getDiagramFromText(diagramText);
    const parsedDiagram = diagram.db.getRootDoc();

    return parsedDiagram
}


function take_directions(parsed_diargam: any): DirectionsArray {
    /**
     * @brief Функция, которая собирает направления из диаграммы
     * @param parsed_diargam: словарь, который был получен из парсера
     * @returns Возвращает направления из диаграммы и комментарий к ней
     */
    const directions: DirectionsArray = []

    for(let i = 0; i < parsed_diargam.length; i++) {
        if(parsed_diargam[i].stmt === 'relation') {
        const direction_i: string[] = []
        const st1 = parsed_diargam[i].state1.id
        const st2 = parsed_diargam[i].state2.id

        if(st1 === '[*]' && st2 === '[*]') {
            direction_i.push('~~~START~~~')
            direction_i.push('~~~END~~~')
        }
        if (st1 === '[*]') {
            direction_i.push('~~~START~~~')
            direction_i.push(st2)
        }
        else if(st2 === '[*]') {
            direction_i.push(st1)
            direction_i.push('~~~END~~~')
        }
        else {
            direction_i.push(st1)
            direction_i.push(st2)
        }

        const keys = Object.keys(parsed_diargam[i])
        if(keys.includes('description')) {
            const descr = parsed_diargam[i].description
            direction_i.push(descr)
        }
        else {
            direction_i.push('')
        }

        directions.push(direction_i)
        }
    }

    return directions
}


function get_all_elements(directions: DirectionsArray): string[] {
    /**
     * @brief Функция, которая собирает элементы, которые есть в мермаид диаграмме
     * @param directions: массив направлений
     * @returns Возвращает элементы диаграммы в виде массива
     */
    const dict_elements: string[] = []

    for(let i = 0; i < directions.length; i++) {
        for(let j = 0; j < 2; j++) {
            const element = directions[i][j]
            if(!dict_elements.includes(element)) {
                dict_elements.push(element)
            }
        }
    }

    return dict_elements
}


function setup_actions(directions: DirectionsArray, all_elements: string[]) {
    /**
     * @brief Функция, которая делает словарь связей actions
     * @param directions: массив направлений
     * @param all_elements: элементы, которые есь в мермаид диаграмме
     * @returns Возвращает словарь actions
     */
    const actions: any = {}

    for (let i = 0; i < all_elements.length; i++) {
        const element_i = all_elements[i]
        actions[element_i] = {}
        for(let j = 0; j < all_elements.length; j++) {
            const element_j = all_elements[j]
            actions[element_i][element_j] = null
        }
    }

    for(let i = 0; i < directions.length; i++) {
        const pair_of_elements = directions[i]
        const from = pair_of_elements[0]
        const to = pair_of_elements[1]
        const description = pair_of_elements[2]

        if(actions[from][to] === null) {
            actions[from][to] = [description]

        }
        else {
            actions[from][to].push(description)
        }
    }

    return actions
}


function setup_notes(parsed_diargam: any, all_elements: string[]) {
    /**
     * @brief Функция, которая достаёт записки из мермаид диаграммы
     * @param parsed_diargam: словарь, который был получен из парсера
     * @param all_elements: элементы, которые есь в мермаид диаграмме
     * @returns Возвращает словарь записок из мермаид диаграммы
     */
    const notes: any = {}

    for(let i = 0; i < all_elements.length; i++) {
        const element_i = all_elements[i]
        notes[element_i] = null
    }

    for(let i = 0; i < parsed_diargam.length; i++) {
        if(parsed_diargam[i].stmt === 'state') {
            const keys = Object.keys(parsed_diargam[i])

            if(keys.includes('note')) {
                const note_keys = Object.keys(parsed_diargam[i].note)

                if(note_keys.includes('text')) {
                    const from: string = parsed_diargam[i].id
                    const note_text: string = parsed_diargam[i].note.text

                    if(notes[from] === null) {
                        notes[from] = [note_text]
                    }
                    else {
                        notes[from].push(note_text)
                    }
                }
            }
        }
    }

    return notes
}


function find_sus_directions(directions: DirectionsArray) {
    /**
     * @brief Функция, собирает подозрительные переходы без комментариев
     * @param directions: массив направлений
     * @returns Возвращает массив с подозрительными переходами
     */
    const sus_directions: any[] = []

    for(let i = 0; i < directions.length; i++) {
        if(directions[i][2] === '') {
            sus_directions.push(directions[i])
        }
    }
    return sus_directions
}

function mark_graph(parsed_diargam: any, directions: DirectionsArray, all_elements: string[]) {
    /**
     * @brief Функция, которая по направлениям и элементам строит словарь связей
     * @param parsed_diargam: словарь, который был получен из парсера
     * @param directions: массив направлений
     * @param all_elements: элементы, которые есь в мермаид диаграмме
     * @returns Возвращает словарь связей
     */
    const mermaid_graph: any = {}
    mermaid_graph['states'] = all_elements
    mermaid_graph['actions'] = setup_actions(directions, all_elements)
    mermaid_graph['notes'] = setup_notes(parsed_diargam, all_elements)
    mermaid_graph['sus_directions'] = find_sus_directions(directions)

    return mermaid_graph
}


function find_choices(parsed_diargam: any): string[] {
    /**
     * @brief Функция, которая ищет "элементы развилки"
     * @param parsed_diargam: словарь, который был получен из парсера
     * @returns Возвращает массив с "элементами развилки"
     */
    const choices: string[] = []

    for(let i = 0; i < parsed_diargam.length; i++) {
        if(parsed_diargam[i].stmt === 'state') {
            const keys = Object.keys(parsed_diargam[i])
            if(keys.includes('type')) {
                const state_type = parsed_diargam[i].type

                if(state_type === 'choice') {
                    const choice_element = parsed_diargam[i].id
                    choices.push(choice_element)
                }
            }
        }
    }

    return choices
}


function mark_choices(parsed_diargam: any, directions: DirectionsArray, mermaid_graph: any) {
    /**
     * @brief Функция, которая дополняет связи actions пунктами из "элементов развилок"
     * @param parsed_diargam: словарь, который был получен из парсера
     * @param directions: массив направлений
     * @param mermaid_graph: словарь связей, который будет дополнен
     * @returns Возвращает обновлённый словарь связей
     */
    const choices = find_choices(parsed_diargam)

    for(let k = 0; k < choices.length; k++) {
        const choice: string = choices[k]

        const branch = mermaid_graph['actions'][choice]
        for(let i = 0; i < directions.length; i++) {
            const to_choice = directions[i][1]

            if(to_choice === choice) {
                const from = directions[i][0]
                const choice_description = directions[i][2]

                //в mermaid_graph должен в from добавить пункты из to
                for(const to in mermaid_graph['actions'][from]) {
                    if(branch[to] !== null) {
                        if(mermaid_graph['actions'][from][to] === null) {
                            //mermaid_graph['actions'][from][to] = branch[to]
                            mermaid_graph['actions'][from][to] = [choice_description]
                        }
                        else {
                            //mermaid_graph['actions'][from][to] = mermaid_graph['actions'][from][to].concat(branch[to])
                            mermaid_graph['actions'][from][to].push(choice_description)
                        }
                    }
                }
            }
        }
    }

    return mermaid_graph
}


export async function parse_state_diagram(diagramText: string) {
    /**
     * @brief Построение словаря связей
     * @param diagramText: строка, state диаграмма мермаид
     * @returns Возвращает promise словаря связей
     */
    const parsed_diargam = await diagramParser(diagramText)
    const directions = take_directions(parsed_diargam)
    const all_elements = get_all_elements(directions)
    let state_mermaid_graph = mark_graph(parsed_diargam, directions, all_elements)
    state_mermaid_graph = mark_choices(parsed_diargam, directions, state_mermaid_graph)
    return state_mermaid_graph
}