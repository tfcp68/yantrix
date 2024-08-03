import { Modules } from '../core/modules/index.js';
import { TExpression, TMappedKeys, TNotes } from '@yantrix/yantrix-parser';
import { TDiagramState, TStateDiagramMatrix } from '@yantrix/mermaid-parser';

export type TStateDiagramMatrixIncludeNotes = {
	states: TStateIncludingNotes[];
} & Omit<TStateDiagramMatrix, 'states'>;

type TDiagramStateOmitNotes = Omit<TDiagramState, 'notes'>;

export type TStateIncludingNotes = {
	notes: TNotes | null;
} & TDiagramStateOmitNotes;

export interface ICodegenOptions {
	language: TOutLang;
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

export interface ICodegen {
	getDictionaries(): string;

	/**
	 * The output of this method should be a string that represents the action to state mapping.
	 * Example: {
	 *     state1: {
	 *            action1: state2
	 *     }
	 * }
	 */
	getActionToStateFromState(): string;

	getClassTemplate(className: string): string;

	getImports(): string;

	getDefaultContext(): string;
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
