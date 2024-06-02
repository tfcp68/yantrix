#!/usr/bin/env tsx

import { program } from 'commander';
import pc from 'picocolors';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { generateAutomataFromStateDiagram } from '../src/index.js';
import { TStateDiagramStructure, createStateDiagram, parseStateDiagram } from '@yantrix/mermaid-parser';
import { TStateDiagramSyntaxTree } from '../src/types/common.js';
import { writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';

const allowedLangs = ['TypeScript', 'JavaScript', 'C#', 'Java', 'C++', 'C', 'Python', 'PHP', 'Ruby', 'Kotlin'];

const langExts = {
	TypeScript: 'ts',
	JavaScript: 'js',
	CSharp: 'cs',
	Java: 'java',
	CPlusPlus: 'cpp',
	C: 'c',
	Python: 'py',
	Php: 'php',
	Ruby: 'rb',
	Kotlin: 'kt',
};

program
	.name('codegen')
	.description('CLI to generate temporary Automata for tests')
	.version('1.0.0')
	.requiredOption('-l, --outLang <lang>', 'Output language for the generated code')
	.requiredOption('-o, --outFolder <folder>', 'Output folder for the generated Automata file')
	.requiredOption('-c, --className <name>', 'Class name for the generated Automata')
	.requiredOption('-i, --inputDiagram <diagram>', 'Input state diagram as a text file or diagram string')
	.action(async (options) => {
		try {
			const { outLang, outFolder, className, inputDiagram } = options;
			if (!allowedLangs.includes(outLang)) {
				throw new Error(`Invalid output language: ${outLang}`);
			}

			let parsed: TStateDiagramStructure;
			try {
				const diagramContent = readFileSync(inputDiagram, 'utf8');
				parsed = await parseStateDiagram(diagramContent);
			} catch (error) {
				parsed = await parseStateDiagram(inputDiagram);
			}

			const diagram = (await createStateDiagram(parsed)) as TStateDiagramSyntaxTree;
			const generatedCode = await generateAutomataFromStateDiagram(diagram, {
				outLang,
				className,
			});

			const filePath = `${outFolder}/${className}_generated.${langExts[outLang]}`;
			await writeFile(filePath, generatedCode, 'utf8');

			let testPatternContent = readFileSync('bin/test-pattern.txt', 'utf8');
			testPatternContent = testPatternContent.replace(/\[REPLACE_ME\]/g, className);
			const testOutputPath = resolve(outFolder, `${className}.test.${langExts[outLang]}`);
			if (!existsSync(dirname(testOutputPath))) {
				mkdirSync(dirname(testOutputPath), { recursive: true });
			}

			writeFileSync(testOutputPath, testPatternContent, 'utf8');

			console.log(pc.green('Automata file generated successfully.'));
		} catch (error) {
			console.error(pc.red('Error generating Automata file:'), error);
		}
	})
	.parse(process.argv);
