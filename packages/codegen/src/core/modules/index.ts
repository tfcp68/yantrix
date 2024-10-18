import { JavaCodegen } from './Java.js';
import { JavaScriptCodegen } from './JavaScript';
import { PythonCodegen } from './Python.js';
import { TypeScriptCodegen } from './TypeScript';

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
