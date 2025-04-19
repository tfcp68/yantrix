const codegenImports = import('@yantrix/codegen');
const mermaidParserImports = import('@yantrix/mermaid-parser');

const defaultGenerateOptions = {
    className: 'TestAutomata',
    outLang: 'javascript'
}

async function generateAutomata(text, options = defaultGenerateOptions) {
    const { generateAutomataFromStateDiagram } = await codegenImports;
    const { parseStateDiagram, createStateDiagram } = await mermaidParserImports;

    const steps = {
        parsing_text: null,
        creating_state_diagram: null,
        generating_automata: null,
        formatting_code: null,
        sending_result: null
    };

    const generationResult = {
        code: null,
        steps: steps,
        error: null,
        timestamp: new Date()
    }

    if (text) {
        let parsedText;
        let stateDiagram;

        // Step 1: parsing text
        try {
            parsedText = await parseStateDiagram(text);
            generationResult.steps.parsing_text = true;
        } catch (e) {
            generationResult.steps.parsing_text = false;
            generationResult.error = e.message;
            return generationResult;
        }

        // Step 2: creating state diagram
        try {
            stateDiagram = await createStateDiagram(parsedText);
            generationResult.steps.creating_state_diagram = true;
        } catch (e) {
            generationResult.steps.creating_state_diagram = false;
            generationResult.error = e.message;
            return generationResult;
        }

        // Step 3: generating automata
        try {
            generationResult.code = await generateAutomataFromStateDiagram(stateDiagram, options);
            generationResult.steps.generating_automata = true;
        } catch (e) {
            generationResult.steps.generating_automata = false;
            generationResult.error = e.message;
            return generationResult;
        }

        return generationResult;
    }
}

module.exports = { generateAutomata };