import { Modules } from '@yantrix/codegen';

export type TLanguage = keyof typeof Modules;

/**
 * Interace that represents the arguments that can be passed to the CLI.
 * @interface IArgv
 * @property {string} ['language'] - The language to generate the code in.
 * @property {string} ['outfile'] - The output file path.
 * @property {string} ['className'] - The name of the generated Automata class.
 * @property {string} ['class-name'] - The name of the generated Automata class.
 * @property {string} ['constants'] - Stringified JSON with constants to be used in generated Automata.
 * @property {string} ['constants-file'] - Path to JSON file with constants to be used in generated Automata.
 * @property {string} ['constantFile'] - Path to JSON file with constants to be used in generated Automata.
 * @property {string} ['diagram-file'] - Path to the file containing the state diagram.
 * @property {string} ['diagramFile'] - Path to the file containing the state diagram.
 * @property {boolean} ['verbose'] - Verbose mode.
 * @property {boolean} ['interactive'] - Enter interactive mode.
 * @property {string} ['eval'] - Evaluate the given state diagram.
 * @property {(string | number)[]} ['_'] - Additional arguments.
 */
export interface IArgv {
	'language'?: string;
	'outfile'?: string;
	'className'?: string;
	'class-name'?: string;
	'constants'?: string;
	'constants-file'?: string;
	'constantFile'?: string;
	'diagram-file'?: string;
	'diagramFile'?: string;
	'verbose'?: boolean;
	'interactive'?: boolean;
	'eval'?: string;
	'_': (string | number)[];
	'$0': string;
}
