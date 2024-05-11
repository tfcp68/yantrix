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
