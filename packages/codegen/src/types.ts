import { codegens } from './codegens/index.js';

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

export interface ICodegen {
  dictionaries: string[];
  changeStateHandlers: string[];
  handlersDict: string[];
  getClassTemplate(className: string): string;
  getImports(): string;
}

export type TCodegenType = keyof typeof codegens;
