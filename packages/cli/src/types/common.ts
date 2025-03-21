import { Modules } from '@yantrix/codegen';

export type TLanguage = keyof typeof Modules;

/**
 * Interface that represents the arguments that can be passed to the CLI.
 */
export interface IArgv {
	/** The language to generate the code in. See list of supported languages [here](/integrations/100_language_support.html). */
	'language'?: string;
	/** The output file path. */
	'outfile'?: string;
	/** The name of the generated Automata class. */
	'className'?: string;
	/** The name of the generated Automata class. */
	'class-name'?: string;
	/** Stringified JSON with constants to be used in generated Automata. */
	'constants'?: string;
	/** Path to JSON file with constants to be used in generated Automata. */
	'constants-file'?: string;
	/** Path to JSON file with constants to be used in generated Automata. */
	'constantFile'?: string;
	/** Path to the file containing the state diagram. */
	'diagram-file'?: string;
	/** Path to the file containing the state diagram. */
	'diagramFile'?: string;
	/** Verbose mode. */
	'verbose'?: boolean;
	/**  Enter interactive mode. */
	'interactive'?: boolean;
	/** Evaluate the given state diagram. */
	'eval'?: string;
	/** Additional arguments. */
	'_': (string | number)[];
	'$0': string;
}
