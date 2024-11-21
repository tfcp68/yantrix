import { Modules } from '@yantrix/codegen';

export type TLanguage = keyof typeof Modules;

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
