import { TStateDiagram } from '@yantrix/mermaid-parser';
import { Modules } from '../core/modules/index.js';

export type TStateDiagramSyntaxTree = TStateDiagram;

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

	/**
	 * Возвращает объект возможных переходов к состояниям из каждого состояния
	 * Пример вида {
	 *     состояние1: {
	 *            действие1: состояние2
	 *     }
	 * }
	 */
	getActionToStateFromState(): string;

	getClassTemplate(className: string): string;

	getImports(): string;
}

export type TOutLang = keyof typeof Modules;
