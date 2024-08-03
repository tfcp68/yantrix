import { JavaScriptCodegen } from './JavaScript.js';
import { TypeScriptCodegen } from './TypeScript.js';
import { PythonCodegen } from './Python.js';
import { JavaCodegen } from './Java.js';

export const Modules = {
	JavaScript: JavaScriptCodegen,
	TypeScript: TypeScriptCodegen,
	Python: PythonCodegen,
	Java: JavaCodegen,
} as const;
