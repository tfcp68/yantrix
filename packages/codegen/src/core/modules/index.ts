import { JavaCodegen } from './Java.js';
import { JavaScriptCodegen } from './JavaScript';
import { PythonCodegen } from './Python.js';
import { TypeScriptCodegen } from './TypeScript';

export const ModuleNames = {
	JavaScript: 'javascript',
	TypeScript: 'typescript',
	Python: 'python',
	Java: 'java',
} as const;

export const Modules = {
	[ModuleNames.JavaScript]: JavaScriptCodegen,
	[ModuleNames.TypeScript]: TypeScriptCodegen,
	[ModuleNames.Python]: PythonCodegen,
	[ModuleNames.Java]: JavaCodegen,
} as const;
