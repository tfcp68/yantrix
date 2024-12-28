import { exec } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import * as p from '@clack/prompts';
import { generateAutomataFromStateDiagram } from '@yantrix/codegen';
import { createStateDiagram, parseStateDiagram } from '@yantrix/mermaid-parser';
import c from 'ansis';
import { isSymbol } from 'lodash-es';
import { TLanguage } from '../../types/common';
import { DISABLE_FLAGS, EXIT_ERROR_CODE, EXIT_SUCCESS_CODE, LANGUAGES } from '../../utils/constants';
import { isGitClean, isJSON } from '../../utils/utils';

export async function interactive() {
	const results = await p.group({
		uncommittedConfirmed: async () => {
			if (isGitClean())
				return Promise.resolve(true);

			const confirmed = await p.confirm({
				initialValue: false,
				message: 'There are uncommitted changes in the current repository, are you sure to continue?',
			});

			if (!confirmed) {
				p.cancel('Automata generation cancelled');
				process.exit(EXIT_SUCCESS_CODE);
			}

			return confirmed;
		},
		diagram: async () => {
			const path = await p.text({
				placeholder: './diagram.mermaid',
				message: 'Enter path to the *.mermaid diagram file',
			});

			if (isSymbol(path)) {
				p.cancel('Automata generation cancelled');
				process.exit(EXIT_SUCCESS_CODE);
			}

			if (!path || path.trim() === '') {
				p.cancel('Diagram file path cannot be empty!');
				process.exit(EXIT_ERROR_CODE);
			}

			if (!existsSync(resolve(path))) {
				p.cancel('Provided diagram file path does not exist');
				process.exit(EXIT_ERROR_CODE);
			}

			const content = readFileSync(path, 'utf8');

			if (content.length === 0) {
				p.cancel('Diagram file is empty!');
				process.exit(EXIT_ERROR_CODE);
			}

			return content;
		},
		language: () => {
			return p.select({
				initialValue: LANGUAGES[0],
				message: 'Select the language for the generated Automata',
				options: LANGUAGES.map(lang => ({
					value: lang,
					label: lang,
				})),
			});
		},
		outfile: async () => {
			const path = await p.text({
				placeholder: './Automata.ts',
				message: 'Enter the output file path',
			});

			if (isSymbol(path)) {
				p.cancel('Automata generation cancelled');
				process.exit(EXIT_SUCCESS_CODE);
			}

			if (!path || path.trim() === '') {
				p.cancel('Output file path cannot be empty!');
				process.exit(EXIT_ERROR_CODE);
			}

			return resolve(path);
		},
		className: async () => {
			const cn = await p.text({
				placeholder: 'Automata',
				message: 'Enter the name of the generated Automata class',
			});

			if (isSymbol(cn)) {
				p.cancel('Automata generation cancelled');
				process.exit(EXIT_SUCCESS_CODE);
			}

			if (!cn || cn.trim() === '') {
				p.cancel('Class name cannot be empty');
				process.exit(EXIT_ERROR_CODE);
			}

			if (!/[a-z_]\w*/i.test(cn)) {
				p.cancel('Class name must satisfy regex /[a-z_]\\w*/i');
				process.exit(EXIT_ERROR_CODE);
			}

			return cn;
		},
		constants: async () => {
			const choice = await p.select({
				initialValue: 'skip',
				message: 'Add constants in generated Automata?',
				options: [
					{
						value: 'skip',
						label: 'No, skip this step',
					},
					{
						value: 'json',
						label: 'Yes, from JSON string',
					},
					{
						value: 'file',
						label: 'Yes, from ".json" file',
					},
				],
			});

			if (choice === 'json') {
				const text = await p.text({
					placeholder: '{"a": "A", "b": "B", "c": "C"}',
					message: 'Enter constants to be used in generated Automata',
				});

				if (isSymbol(text)) {
					p.cancel('Automata generation cancelled');
					process.exit(EXIT_SUCCESS_CODE);
				}

				if (!text || text.trim() === '') {
					return p.log.warn('Constants string is empty, skipping this step...');
				}

				if (!isJSON(text)) {
					return p.log.warn('Invalid constants string provided, skipping this step...');
				}

				return text;
			} else if (choice === 'file') {
				const path = await p.text({
					placeholder: './constants.json',
					message: 'Enter path to constants file',
				});

				if (isSymbol(path)) {
					p.cancel('Automata generation cancelled');
					process.exit(EXIT_SUCCESS_CODE);
				}

				if (!path || path.trim() === '') {
					return p.log.warn('Path to constants file is empty, skipping this step...');
				}

				if (!existsSync(resolve(path))) {
					p.cancel('Provided constants file path does not exist');
					process.exit(EXIT_ERROR_CODE);
				}

				if (!path.endsWith('.json')) {
					p.cancel('Path constants file must end with .json');
					process.exit(EXIT_ERROR_CODE);
				}

				const content = readFileSync(path, 'utf8');

				if (content.length === 0) {
					p.cancel('Constants file is empty!');
					process.exit(EXIT_ERROR_CODE);
				}

				if (!isJSON(content)) {
					p.cancel('Invalid constants file provided');
					process.exit(EXIT_ERROR_CODE);
				}

				return content;
			} else {
				return '{}';
			}
		},
	}, {
		onCancel: () => {
			p.cancel('Automata generation cancelled');
			process.exit(0);
		},
	});

	const spinner = p.spinner();
	spinner.start(`Parsing state diagram...`);

	const structure = await parseStateDiagram(results.diagram).catch((err) => {
		const msg1 = 'An error occurred while parsing given state diagram';
		const msg2 = err instanceof Error ? `\n${err.message}` : '';
		spinner.stop(c.red(`${msg1}${msg2}`));
		process.exit(EXIT_ERROR_CODE);
	});

	spinner.message('Creating matrix from given state diagram...');

	const matrix = await createStateDiagram(structure).catch((err) => {
		const msg1 = 'An error occurred creating matrix from given state diagram';
		const msg2 = err instanceof Error ? `\n${err.message}` : '';
		spinner.stop(c.red(`${msg1}${msg2}`));
		process.exit(EXIT_ERROR_CODE);
	});

	spinner.message('Generating Automata...');

	const automata = await generateAutomataFromStateDiagram(matrix, {
		outLang: <TLanguage>results.language,
		className: results.className,
		constants: results.constants,
	}).catch((err) => {
		const msg1 = 'An error occurred while generating Automata';
		const msg2 = err instanceof Error ? `\n${err.message}` : '';
		spinner.stop(c.red(`${msg1}${msg2}`));
		process.exit(EXIT_ERROR_CODE);
	});

	spinner.message(`Writing Automata to file ${results.outfile}...`);

	const writeable = `${DISABLE_FLAGS.join('\n')}\n${automata}`;

	try {
		if (!existsSync(dirname(results.outfile))) mkdirSync(dirname(results.outfile), { recursive: true });
		writeFileSync(results.outfile, writeable, { encoding: 'utf-8' });
		spinner.stop(`Generated Automata saved to ${results.outfile}`);
	} catch (err) {
		const msg1 = 'An error occurred while writing Automata to file';
		const msg2 = err instanceof Error ? `\n${err.message}` : '';
		spinner.stop(c.red(`${msg1}${msg2}`));
		process.exit(EXIT_ERROR_CODE);
	}

	if (results.language.includes('script')) {
		const spinner = p.spinner();

		spinner.start('Installing additional packages...');
		try {
			await exec(`npx nypm install @yantrix/automata @yantrix/functions`);
			spinner.stop('Additional packages installed successfully!');
		} catch (e) {
			const msg1 = 'An error occurred while installing additional packages: "@yantrix/automata", "@yantrix/functions"';
			const msg2 = e instanceof Error ? `\n${e.message}` : '';
			const msg3 = '\n\nPlease install them yourself, otherwise Automata will not work at all';

			spinner.stop(c.red(`${msg1}${msg2}${msg3}`), 1);
			process.exit(EXIT_ERROR_CODE);
		}
		process.exit(EXIT_SUCCESS_CODE);
	}
}
