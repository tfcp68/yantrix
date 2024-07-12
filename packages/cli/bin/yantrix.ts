#!/usr/bin/env node

import { Command, Option } from 'commander';
import fs from 'fs-extra';
import path, { dirname } from 'path';
import { createStateDiagram, parseStateDiagram } from '@yantrix/mermaid-parser';
import { Modules, generateAutomataFromStateDiagram } from '@yantrix/codegen';
import pc from 'picocolors';
import { isString } from 'lodash-es';

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

program.name('yantrix').description('Set of CLI tools for Yantrix').version('1.0.0');

program
	.command('codegen')
	.description('Generate Automata from given state diagram')
	.argument('[diagramFile]', 'Diagram file to be parsed', '')
	.addOption(new Option('-l, --language <lang>', 'Output file language').choices(Object.keys(Modules)))
	.option('-o, --outfile <path>', 'Output file path')
	.option('-c, --className <className>', 'Generating Automata class name')
	.option('-e, --eval <diagramText>', 'Evaluate the given state diagram')
	.option('--verbose', 'Enable verbose mode')
	.allowExcessArguments(true)
	.allowUnknownOption(true)
	.action(async (diagramFile: string, options: ICodegenOptions) => {
		let diagramText = '';

		if (isString(options.eval)) {
			if (diagramFile && options.verbose) {
				warn('Ignoring diagram file path because -e/--eval flag is set.');
			}

			diagramText = options.eval;
		} else {
			if (!diagramFile) {
				error('Diagram file path is required.');
				process.exit(1);
			}
			const filePath = path.resolve(diagramFile);
			if (options.verbose) wait(`Reading diagram from ${filePath}...`);
			try {
				diagramText = fs.readFileSync(filePath, 'utf-8');
			} catch (err) {
				if (err instanceof Error) error(err.message);
				process.exit(1);
			}
		}

		if (!diagramText || diagramText.trim().length === 0) {
			error('Diagram cannot be empty.');
			process.exit(1);
		}

		if (!options.outfile) {
			error('Output file path flag is required: -o, --outfile <path>');
			process.exit(1);
		}

		if (!options.language) {
			error('Output language flag is required: -l, --language <lang>');
			process.exit(1);
		}

		const allowedLangs = Object.keys(Modules);
		if (!allowedLangs.includes(options.language)) {
			const allowedMsg = `Allowed languages: ${allowedLangs.join(', ')}`;
			error(`Invalid output language specified. ${allowedMsg}`);
			process.exit(1);
		}

		const className = options.className ?? 'GeneratedAutomata';
		if (!/^[\w]+$/.test(className)) {
			error('Invalid characters in class name specified.');
			process.exit(1);
		}

		const withError = async <T>(promise: Promise<T>) => {
			const [settled] = await Promise.allSettled([promise]);
			if (settled.status === 'rejected') {
				return [settled.reason as Error, null] as const;
			} else {
				return [null, settled.value] as const;
			}
		};

		const [genErr, generatedAutomata] = await withError(
			(async () => {
				if (options.verbose) {
					wait('Parsing given state diagram: ');
					for (const line of diagramText.split('\n')) wait(line);
				}

				const structure = await parseStateDiagram(diagramText);
				const diagram = await createStateDiagram(structure);

				return generateAutomataFromStateDiagram(diagram, {
					outLang: options.language,
					className,
				});
			})(),
		);

		if (genErr) {
			error(`Failed to parse state diagram. ${genErr.message}`);
			error(genErr.stack ?? '');
			process.exit(1);
		}

		const disableFlagLines = checkDisableFlags.join('\n');
		const textToWrite = `${disableFlagLines}\n\n${generatedAutomata}`;
		const outputFilePath = path.resolve(options.outfile);

		try {
			if (options.verbose) {
				wait(`Saving generated Automata to ${outputFilePath}`);
			}

			fs.ensureDirSync(dirname(outputFilePath));
			fs.writeFileSync(outputFilePath, textToWrite, { encoding: 'utf-8' });

			if (options.verbose) {
				success(`Generated Automata saved to ${outputFilePath}`);
			}
		} catch (err) {
			if (err instanceof Error) error(err.message);
			process.exit(1);
		}
	});

program.parse(process.argv);
