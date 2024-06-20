import { JavaScriptCodegen } from './JavaScript.js';
import { TypeScriptCodegen } from './TypeScript.js';
import { PythonCodegen } from './Python.js';

export const Modules = {
	JavaScript: JavaScriptCodegen,
	TypeScript: TypeScriptCodegen,
	Python: PythonCodegen,
} as const;
