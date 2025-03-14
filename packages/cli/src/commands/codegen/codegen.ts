import fs from 'node:fs';
import path from 'node:path';
import * as p from '@clack/prompts';
import { generateAutomataFromStateDiagram } from '@yantrix/codegen';
import { createStateDiagram, parseStateDiagram } from '@yantrix/mermaid-parser';
import { IArgv, TLanguage } from '../../types/common';
import { isProvided } from '../../types/guards';
import { DISABLE_FLAGS, EXIT_ERROR_CODE, LANGUAGES, RE_CLASS_NAME } from '../../utils/constants';
import { isJSON, toFilteredArgvs } from '../../utils/utils';
import { interactive } from './interactive';

export async function codegen(argv: IArgv) {
	const argvs = Object.keys(argv);
	const fargvs = toFilteredArgvs(argvs);
	if (!fargvs.length) {
		throw new Error(`No arguments provided! Use "${argv.$0} ${argv._[0]} --help" for more information.`);
	}

	if (argv.interactive) {
		const others = fargvs.filter(x => x !== 'interactive');
		if (others.length > 0) p.log.warn(`Ignoring arguments: ${others.join(', ')}.`);
		interactive();
	} else {
		let diagramText = '';

		if (isProvided(argv.eval)) {
			if (isProvided(argv.diagramFile) && argv.verbose) {
				p.log.warn('Ignoring diagram file path because "eval" flag is set.');
			}

			diagramText = argv.eval;
		} else {
			if (!isProvided(argv.diagramFile)) {
				p.log.error('Diagram file path is required.');
				process.exit(EXIT_ERROR_CODE);
			}

			const filePath = path.resolve(argv.diagramFile);
			if (!fs.existsSync(filePath)) {
				p.log.error(`Provided diagram file path does not exist: ${filePath}`);
				process.exit(EXIT_ERROR_CODE);
			}

			if (argv.verbose) p.log.warn(`Reading diagram from ${filePath}...`);

			try {
				diagramText = fs.readFileSync(filePath, 'utf-8');
			} catch (err) {
				if (err instanceof Error) p.log.error(err.message);
				process.exit(EXIT_ERROR_CODE);
			}
		}

		let constants = '{}';
		const className = argv.className ?? 'GeneratedAutomata';

		switch (true) {
			case !isProvided(diagramText): {
				p.log.error('Diagram cannot be empty.');
				return process.exit(EXIT_ERROR_CODE);
			}
			case !isProvided(argv.outfile): {
				p.log.error('Output file path flag is required (--outfile <path>)');
				return process.exit(EXIT_ERROR_CODE);
			}
			case !isProvided(argv.language): {
				p.log.error('Output language flag is required (--language <lang>)');
				return process.exit(EXIT_ERROR_CODE);
			}
			case !LANGUAGES.includes(<TLanguage>argv.language): {
				const allowedMsg = `Allowed languages: ${LANGUAGES.join(', ')}`;
				p.log.error(`Invalid output language specified. ${allowedMsg}`);
				return process.exit(EXIT_ERROR_CODE);
			}
			case argv.verbose && !isProvided(argv.className): {
				p.log.warn(`Class name not specified, using default (${className})`);
				return process.exit(EXIT_ERROR_CODE);
			}
			case !RE_CLASS_NAME.test(className): {
				p.log.error('Invalid characters in class name specified.');
				return process.exit(EXIT_ERROR_CODE);
			}
			default: {
				if (isProvided(argv.constantFile)) {
					if (isProvided(argv.constants) && argv.verbose) {
						p.log.warn('Ignoring "constants" flag because "constants-file" flag is set.');
					}

					const filePath = path.resolve(argv.constantFile);
					if (!fs.existsSync(filePath)) {
						p.log.error('Provided constants file path does not exist');
						return process.exit(EXIT_ERROR_CODE);
					}

					if (argv.verbose) p.log.warn(`Reading constants from ${filePath}...`);
					try {
						constants = fs.readFileSync(filePath, 'utf-8');
					} catch (err) {
						if (err instanceof Error) p.log.error(err.message);
						return process.exit(EXIT_ERROR_CODE);
					}
				} else if (isProvided(argv.constants)) {
					if (!isJSON(argv.constants)) {
						p.log.error('Constants must be a valid JSON string.');
						return process.exit(EXIT_ERROR_CODE);
					}

					constants = argv.constants;
				}
			}
		}

		if (argv.verbose) p.log.warn(`Parsing given state diagram:\n${diagramText}`);

		const structure = await parseStateDiagram(diagramText).catch((err) => {
			p.log.error('An error occurred while parsing given state diagram');
			if (err instanceof Error) p.log.error(err.message);
			process.exit(EXIT_ERROR_CODE);
		});

		const matrix = await createStateDiagram(structure).catch((err) => {
			p.log.error('An error occurred creating matrix from given state diagram');
			if (err instanceof Error) p.log.error(err.message);
			process.exit(EXIT_ERROR_CODE);
		});

		const automata = await generateAutomataFromStateDiagram(matrix, {
			outLang: <TLanguage>argv.language,
			className,
			constants,
		}).catch((err) => {
			p.log.error('An error occurred while generating Automata');
			if (err instanceof Error) p.log.error(err.message);
			process.exit(EXIT_ERROR_CODE);
		});

		const disableFlagLines = DISABLE_FLAGS.join('\n');
		const writeable = `${disableFlagLines}\n\n${automata}`;
		const outputFilePath = path.resolve(argv.outfile);

		try {
			if (argv.verbose) {
				p.log.warn(`Saving Automata to ${outputFilePath}...`);
			}

			const outdir = path.dirname(outputFilePath);
			if (!fs.existsSync(outdir)) fs.mkdirSync(outdir, { recursive: true });

			fs.writeFileSync(outputFilePath, writeable, { encoding: 'utf-8' });

			p.log.success(`Automata saved to ${outputFilePath}`);

			// if (argv.language.includes('script')) {
			// 	const message = [
			// 		'Since you have chosen the *-script language, ',
			// 		'you need to install additional packages to work with the generated Automata:',
			// 		'\n - @yantrix/automata',
			// 		'\n - @yantrix/functions',
			// 	].join('');

			// 	p.log.warn(message);
			// }
		} catch (err) {
			if (err instanceof Error) p.log.error(err.message);
			process.exit(EXIT_ERROR_CODE);
		}
	}
}
