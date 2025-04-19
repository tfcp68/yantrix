const express = require('express');
const router = express.Router();

const prettier = require('prettier');

const { generateAutomata } = require('../api/generateAutomata');

router.post('/', async (req, res) => {
    const { diagramText } = req.body;
    if (!diagramText) res.status(400).json({ files: [], errorText: 'No diagram text found!', steps: null, timestamp: new Date() });
    
    const generationResult = await generateAutomata(diagramText);

    // error processing
    if (generationResult.code === null) {
        if (generationResult.error === null) {
            res.status(500).json({ files: [], errorText: 'Unexpected error during automata generation!', steps: generationResult.steps, timestamp: generationResult.timestamp });
        }
        else {
            res.status(400).json({ files: [], errorText: generationResult.error, steps: generationResult.steps, timestamp: generationResult.timestamp });
        }
        return;
    }

    const generatedCode = generationResult.code;
    

    let formattedCode;
    try {
        formattedCode = await prettier.format(generatedCode, { semi: false, parser: 'babel' });
        generationResult.steps.formatting_code = true;
    } catch (e) {
        generationResult.steps.formatting_code = false;
        res.status(500).json({ files: [], errorText: `Could not format code!\n ${e.message}`, steps: generationResult.steps, timestamp: generationResult.timestamp });
        return;
    }

    const result = [
        {
            name: 'TestAutomata_generated.js',
            text: formattedCode,
            language: 'javascript'
        },
        {
            name: 'Test',
            text: 'lol',
            language: 'asd'
        }
    ]

    generationResult.steps.sending_result = true;

    res.json({ files: result, errorText: null, steps: generationResult.steps, timestamp: generationResult.timestamp });
    
});

module.exports = router;