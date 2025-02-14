/**
 * @packageDocumentation
 *
 * Command-line interface for [Yantrix](https://github.com/tfcp68/yantrix/) framework.
 * This package is a console wrapper for certain Yantrix tooling, most notably [code generation](https://www.npmjs.com/package/@yantrix/codegen)
 *
 * ## 📖 Installation

Install both `@yantrix/cli` and `@yantrix/codegen` using your prefered package manager. All the secondary dependencies will be installed automatically.

```bash
# Via NPM
$ npm install @yantrix/codegen @yantrix/cli

# Via Yarn
$ yarn add @yantrix/codegen @yantrix/cli

# Via PNPM
$ pnpm install @yantrix/codegen @yantrix/cli

# ✨ Auto-detection
$ npx nypm install @yantrix/codegen @yantrix/cli
```
> We suggest using `pnpm`

## Usage

To get help on the `codegen` command, run:
```bash
yantrix codegen -h
```

It will print the following:
```bash
yantrix codegen [diagramFile]

Generates Automata from given mermaid state diagram

Positionals:
  diagramFile  Diagram file to be parsed. It should have .mermaid extension
                                                                        [string]

Options:
  -l, --language      Output file language. Currently supported: javascript, typ
                      escript, python, java                             [string]
  -o, --outfile       Output Automata file path                         [string]
  -c, --className     Name of the generated Automata class              [string]
  -j, --constants     Stringified JSON with constants to be used in generated Au
                      tomata                                            [string]
  -J, --constantFile  Path to JSON file with constants to be used in generated A
                      utomata                                           [string]
  -e, --eval          Evaluate the given state diagram                  [string]
      --verbose       Verbose mode                                     [boolean]
  -i, --interactive   Enter interactive mode                           [boolean]
  -h, --help          Show help                                        [boolean]
  -v, --version       Show version number                              [boolean]
```

For quick start, let's generate a simple Automata from a diagram saved in a file `diagram.mermaid`:
```mermaid
stateDiagram-v2
    [*] --> First: reset
    First --> Second: event1
    Second --> Third: event2
```

Just run:
```bash
$ yantrix codegen ./diagram.mermaid -o ./automata.ts -c MyAutomata -l typescript'
```

This will generate a file `automata.ts`. But that's not all - since we generated in Typescript, we should also install a couple of dependencies, that Automata depends on:
```bash
# Via NPM
$ npm install @yantrix/automata @yantrix/functions

# Via Yarn
$ yarn add @yantrix/automata @yantrix/functions

# Via PNPM
$ pnpm install @yantrix/automata @yantrix/functions

# ✨ Auto-detection
$ npx nypm install @yantrix/automata @yantrix/functions
```

In any case, this will be reported during the generation process, like this:
```bash
Since you have chosen the *-script language, you need to install additional packages to work with the generated Automata:
	- @yantrix/automata
	- @yantrix/functions
```

For more information, see also:
- [Quick start in Typescript](https://tfcp68.github.io/yantrix/)
- [Learn language options](https://tfcp68.github.io/yantrix/integrations/100_language_support.html)
- [Diagram examples](https://tfcp68.github.io/yantrix/concepts/999_design_examples.html)
 *
 */

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
