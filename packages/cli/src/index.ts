import * as p from '@clack/prompts';
import c from 'ansis';
import { isError } from 'lodash-es';
import restoreCursor from 'restore-cursor';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import pkg from '../package.json';
import { codegen } from './commands/codegen/codegen';
import { LANGUAGES } from './utils/constants';

// eslint-disable-next-line ts/no-unused-expressions
yargs(hideBin(process.argv))
	.scriptName('yantrix')
	.usage('$0 [options] <command>')
	.command(
		'codegen [diagramFile]',
		'Generates Automata from given mermaid state diagram',
		(args) => {
			return args
				.positional('diagramFile', {
					describe: 'Diagram file to be parsed. It should have .mermaid extension',
					type: 'string',

				})
				.option('language', {
					alias: 'l',
					describe: `Output file language. Currently supported: ${LANGUAGES.join(', ')}`,
					type: 'string',
					coerce: l => l.toLowerCase(),
				})
				.option('outfile', {
					alias: 'o',
					describe: 'Output Automata file path',
					type: 'string',
				})
				.option('className', {
					alias: 'c',
					describe: 'Name of the generated Automata class',
					type: 'string',

				})
				.option('constants', {
					alias: 'j',
					describe: 'Stringified JSON with constants to be used in generated Automata',
					type: 'string',
				})
				.option('constantFile', {
					alias: 'J',
					describe: 'Path to JSON file with constants to be used in generated Automata',
					type: 'string',
				})
				.option('eval', {
					alias: 'e',
					describe: 'Evaluate the given state diagram',
					type: 'string',
				})
				.option('verbose', {
					describe: 'Verbose mode',
					type: 'boolean',
				})
				.option('interactive', {
					alias: 'i',
					describe: 'Enter interactive mode',
					type: 'boolean',
				});
		},
		async (argv) => {
			p.intro(`${c.yellowBright(`@yantrix/cli `)}${c.dim(`v${pkg.version}`)}`);

			try {
				await codegen(argv);
			} catch (e) {
				const msg = isError(e)
					? c.red(e.message)
					: c.red(`✘ Failed to generate Automata.`);

				p.log.error(msg);
			}
		},
	)
	.showHelpOnFail(false)
	.alias('h', 'help')
	.version('version', pkg.version)
	.alias('v', 'version')
	.help()
	.argv;

restoreCursor();
