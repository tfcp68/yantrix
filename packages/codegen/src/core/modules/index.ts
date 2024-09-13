import { JavaCodegen } from './Java.js';
import { JavaScriptCodegen } from './JavaScript.js';
import { PythonCodegen } from './Python.js';
import { TypeScriptCodegen } from './TypeScript.js';

export const ModuleNames = {
	JavaScript: 'JavaScript',
	TypeScript: 'TypeScript',
	Python: 'Python',
	Java: 'Java',
} as const;

export const Modules = {
	[ModuleNames.JavaScript]: JavaScriptCodegen,
	[ModuleNames.TypeScript]: TypeScriptCodegen,
	[ModuleNames.Python]: PythonCodegen,
	[ModuleNames.Java]: JavaCodegen,
} as const;
