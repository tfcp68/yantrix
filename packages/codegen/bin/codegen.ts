#!/usr/bin/env -S pnpm tsx

import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { stdout } from 'process';
import { format } from 'util';
import { createStateDiagram, parseStateDiagram } from '@yantrix/mermaid-parser';
import { generateAutomataFromStateDiagram } from '../dist/index.js';

const langs = {
	ts: 'TypeScript',
	js: 'JavaScript',
	py: 'Python',
	kt: 'Kotlin',
	rs: 'Rust',
} as const;

interface ICodegenOptions {
	language: keyof typeof langs;
	outdir: string;
	className?: string;
}

const program = new Command();
const log = (...data: unknown[]) => stdout.write(format(...data) + '\n');

const checkDisableFlags = ['/* eslint-disable */', '// @ts-nocheck'];

program
	.name('codegen')
	.description('A CLI tool to generate Automata from given mermaid state diagram')
	.version('1.0.0')
	.argument('<diagramTextOrFile>', 'Diagram to be parsed')
	.option('-o, --outdir <path>', 'Output file path')
	.option('-l, --language <lang>', 'Output language')
	.option('-c, --className <className>', 'Generated Automata class name')
	.action(async (diagramTextOrFile: string, options: ICodegenOptions) => {
		let diagramText = diagramTextOrFile;

		if ((await fs.pathExists(diagramTextOrFile)) && (await fs.stat(diagramTextOrFile)).isFile()) {
			try {
				diagramText = await fs.readFile(diagramTextOrFile, 'utf-8');
			} catch (err) {
				if (err instanceof Error) log(`Error reading file: ${err.message}`);
				process.exit(1);
			}
		}

		if (!diagramText || diagramText.trim().length === 0) {
			log('Error: Diagram cannot be empty.');
			process.exit(1);
		}

		if (!options.outdir) {
			log('Error: Output directory path is required.');
			process.exit(1);
		}

		if (!options.language) {
			log('Error: Output language is required.');
			process.exit(1);
		}

		const outLang = langs[options.language];
		if (!outLang) {
			log('Error: Invalid output language specified.');
			process.exit(1);
		}

		const className = options.className ?? 'GeneratedAutomata';
		if (!/^[\w]+$/.test(className)) {
			log('Error: Invalid characters in class name specified.');
			process.exit(1);
		}

		const structure = await parseStateDiagram(diagramText);
		const diagram = await createStateDiagram(structure);
		const generatedAutomata = await generateAutomataFromStateDiagram(diagram, {
			outLang,
			className,
		});

		const disableFlagLines = checkDisableFlags.join('\n');
		const writable = `${disableFlagLines}\n\n${generatedAutomata}`;

		const outputDirPath = path.resolve(options.outdir);

		try {
			await fs.ensureDir(outputDirPath);

			const outputFilePath = path.join(outputDirPath, `${className}.${options.language}`);
			await fs.writeFile(outputFilePath, writable);
			log(`Generated Automata saved to ${outputFilePath}`);
		} catch (err) {
			if (err instanceof Error) log(`Error: ${err.message}`);
			process.exit(1);
		}
	});

program.parse(process.argv);
