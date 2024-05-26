import { Modules } from '../core/modules/index.js';
import { TMapped, TMappedKeys, TNotes } from '@yantrix/yantrix-parser';
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

export interface IGenerateOptions {
	className: string;
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

	getChangeStateHandlers(): string;

	getHandlers(): string;

	getClassTemplate(className: string): string;

	getImports(): string;
}

export type TOutLang = keyof typeof Modules;

export type TExpressionRecord = {
	[K in TMappedKeys]: (arg: TMapped[K]) => string;
};
