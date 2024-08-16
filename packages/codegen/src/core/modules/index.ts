import { JavaScriptCodegen } from './JavaScript.js';
import { TypeScriptCodegen } from './TypeScript.js';
import { PythonCodegen } from './Python.js';
import { JavaCodegen } from './Java.js';

export enum ModuleNames {
	JavaScript = 'JavaScript',
	TypeScript = 'TypeScript',
	Python = 'Python',
	Java = 'Java',
}

export const Modules = {
	[ModuleNames.JavaScript]: JavaScriptCodegen,
	[ModuleNames.TypeScript]: TypeScriptCodegen,
	[ModuleNames.Python]: PythonCodegen,
	[ModuleNames.Java]: JavaCodegen,
} as const;
