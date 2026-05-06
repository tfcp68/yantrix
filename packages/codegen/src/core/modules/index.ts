import { JavaCodegen } from './Java.js';
import { JavaScriptCodegen } from './JavaScript/index.js';
import { PureJavaScriptCodegen } from './PureJavaScript/index.js';
import { PureTypeScriptCodegen } from './PureTypeScript/index.js';
import { PythonCodegen } from './Python.js';
import { TypeScriptCodegen } from './TypeScript/index.js';

export const ModuleNames = {
	JavaScript: 'javascript',
	TypeScript: 'typescript',
	Python: 'python',
	Java: 'java',
	PureJavaScript: 'pure-javascript',
	PureTypeScript: 'pure-typescript',
} as const;

/**
 * Currently supported language modules for code generation.
 */
export const Modules = {
	[ModuleNames.JavaScript]: JavaScriptCodegen,
	[ModuleNames.TypeScript]: TypeScriptCodegen,
	[ModuleNames.Python]: PythonCodegen,
	[ModuleNames.Java]: JavaCodegen,
	[ModuleNames.PureJavaScript]: PureJavaScriptCodegen,
	[ModuleNames.PureTypeScript]: PureTypeScriptCodegen,
} as const;
