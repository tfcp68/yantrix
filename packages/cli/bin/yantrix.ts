#!/usr/bin/env node

import { Command, Option } from 'commander';
import fs from 'fs-extra';
import path, { dirname } from 'path';
import { createStateDiagram, parseStateDiagram } from '@yantrix/mermaid-parser';
import { Modules, generateAutomataFromStateDiagram } from '@yantrix/codegen';
import pc from 'picocolors';

interface ICodegenOptions {
	language: keyof typeof Modules;
	className: string;
	outfile: string;
	verbose?: boolean;
	eval?: string;
}

const program = new Command();

const error = (m: string) => console.error(pc.bold(pc.red(`❌ ${m}`)));
const warn = (m: string) => console.warn(pc.bold(pc.yellow(`⚠️ ${m}`)));
const success = (m: string) => console.info(pc.bold(pc.green(`✅ ${m}`)));
const wait = (m: string) => console.warn(pc.bold(pc.yellow(`⌛ ${m}`)));

const checkDisableFlags = ['/* eslint-disable */', '// @ts-nocheck'];

program
	.name('yantrix')
	.description('A CLI tool to generate Automata from given mermaid state diagram')
	.version('1.0.0');

program
	.command('codegen')
	.description('A CLI tool to generate Automata from given mermaid state diagram')
	.argument('<diagramFile>', 'Diagram file to be parsed')
	.option('-o, --outfile <path>', 'Output file path')
	.addOption(new Option('-l, --language <lang>', 'Output file language').choices(Object.keys(Modules)))
	.option('-c, --className <className>', 'Generated Automata class name')
	.option('-e, --eval <diagramText>', 'Evaluate the given mermaid state diagram')
	.option('--verbose', 'Enable verbose mode')
	.allowUnknownOption()
	.action(async (diagramFile: string, options: ICodegenOptions) => {
		let diagramText = '';

		if (diagramFile) {
			if (options.eval) {
				if (options.verbose) warn('Ignoring diagram file path because -e/--eval flag is set.');
				diagramText = options.eval;
			} else {
				const filePath = path.resolve(diagramFile);
				if (options.verbose) wait(`Reading diagram from ${filePath}...`);
				try {
					diagramText = fs.readFileSync(filePath, 'utf-8');
				} catch (err) {
					if (err instanceof Error) error(err.message);
					process.exit(1);
				}
			}
		}

		if (!diagramText || diagramText.trim().length === 0) {
			error('Diagram cannot be empty.');
			process.exit(1);
		}

		if (!options.outfile) {
			error('Output file path is required.');
			process.exit(1);
		}

		if (!options.language) {
			error('Output language is required.');
			process.exit(1);
		}

		const allowedLangs = Object.keys(Modules);
		if (!allowedLangs.includes(options.language)) {
			error(`Invalid output language specified. Allowed languages: ${allowedLangs.join(', ')}`);
			process.exit(1);
		}

		const className = options.className ?? 'GeneratedAutomata';
		if (!/^[\w]+$/.test(className)) {
			error('Invalid characters in class name specified.');
			process.exit(1);
		}

		let generatedAutomata;
		try {
			if (options.verbose) wait('Parsing given state diagram...');

			const structure = await parseStateDiagram(diagramText);
			const diagram = await createStateDiagram(structure);
			generatedAutomata = await generateAutomataFromStateDiagram(diagram, {
				outLang: options.language,
				className,
			});
		} catch (err) {}

		if (!generatedAutomata) {
			error(`Failed to parse state diagram. Please check if the given state diagram is valid.`);
			process.exit(1);
		}

		const disableFlagLines = checkDisableFlags.join('\n');
		const textToWrite = `${disableFlagLines}\n\n${generatedAutomata}`;
		const outputFilePath = path.resolve(options.outfile);
		// const outputFileName = outputFilePath.replace(/^.*[\\/]/, '');

		try {
			fs.ensureDirSync(dirname(outputFilePath));
			fs.writeFileSync(outputFilePath, textToWrite, {
				encoding: 'utf-8',
			});
			if (options.verbose) success(`Generated Automata saved to ${outputFilePath}`);
		} catch (err) {
			error(`Failed to write generated Automata. ${err instanceof Error ? err.message : ''}`);
			process.exit(1);
		}
	});

program.parse(process.argv);
