import { TExpression, TMappedKeys, TNotes } from '@yantrix/yantrix-parser';
import { TDiagramState, TStateDiagramMatrix } from '@yantrix/mermaid-parser';
import { ModuleNames, Modules } from '../core/modules/index.js';

export type TStateDiagramMatrixIncludeNotes = {
	states: TStateIncludingNotes[];
} & Omit<TStateDiagramMatrix, 'states'>;

type TDiagramStateOmitNotes = Omit<TDiagramState, 'notes'>;

export type TStateIncludingNotes = {
	notes: TNotes | null;
} & TDiagramStateOmitNotes;

export type TConstants = Record<string, string | number>;

export interface ICodegenOptions<T = TOutLang> {
	language: T;
	constants: TConstants | null;
}

/**
 * Represents the options for generating code.
 */
export interface IGenerateOptions {
	/**
	 * The name of the class Automata  to generate.
	 */
	className: string;

	/**
	 * The output language for the generated code.
	 */
	outLang: TOutLang;

	/**
	 * Constant reference
	 */
	constants?: string;
}

export interface ITypedObjectProps {
	typeName: string;
	typeGuardName: string;
	name: string;
	body: string;
}

export interface ITypedObject extends ITypedObjectProps {
	codeBlock: string;
}

export interface IGetCodeJSOptions {
	className: string;
}

export interface IGetCodeTSOptions extends IGetCodeJSOptions {}

export interface IGetCodePythonOptions {
	className: string;
}

export interface IGetCodeJavaOptions {
	className: string;
}

export type TGetCodeOptionsMap = {
	[ModuleNames.JavaScript]: IGetCodeJSOptions;
	[ModuleNames.Python]: IGetCodePythonOptions;
	[ModuleNames.TypeScript]: IGetCodeTSOptions;
	[ModuleNames.Java]: IGetCodeJavaOptions;
};

export interface ICodegen<T extends TOutLang> {
	getCode: (options: TGetCodeOptionsMap[T]) => string;
}

export type TOutLang = keyof typeof Modules;

export type TExpressionRecord = {
	[K in TMappedKeys]: (arg: TExpression<K>) => string;
};

export const TAssignTypeDict = {
	PAYLOAD: 'payload',
	PREV_CONTEXT: 'prevContext',
} as const;

export type TAssignTypes = (typeof TAssignTypeDict)[keyof typeof TAssignTypeDict];

export type TModuleParams = {
	diagram: TStateDiagramMatrixIncludeNotes;
	constants: TConstants | null;
};
