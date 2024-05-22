import { codegens } from './codegens/index.js';
import { TStateDiagram } from '@yantrix/mermaid-parser';
import { TNotes } from '@yantrix/yantrix-parser';

export interface ICodegenOptions {
	className: string;
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

export type TParsedNotes = {
  state: string;
  dict: TNotes;
};

export type TStateDiagramSyntaxTree = Omit<TStateDiagram, 'notes'> & {
  notes: TParsedNotes[];
};

export interface ICodegen {
  dictionaries: string[];
  changeStateHandlers: string[];
  handlersDict: string[];

  diagram: TStateDiagram;

  getClassTemplate(className: string): string;

  getImports(): string;
}

export type TCodegenType = keyof typeof codegens;
