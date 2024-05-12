import { TStateDiagram } from '@yantrix/mermaid-parser';

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
  dictionaries: string[];
  changeStateHandlers: string[];
  handlersDict: string[];
  getClassTemplate(className: string): string;
  getImports(): string;
}

export type TOutLang = 'JavaScript' | 'TypeScript';
