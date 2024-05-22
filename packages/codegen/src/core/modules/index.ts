import { JavaScriptCodegen } from './JavaScript.js';
import { TypeScriptCodegen } from './TypeScript.js';

export const Modules = {
	JavaScript: JavaScriptCodegen,
	TypeScript: TypeScriptCodegen,
} as const;
