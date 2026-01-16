import { AstNode, EmptyFileSystem } from 'langium';
import {
	ContextStatement,
	DefineFunction,
	DefineStatement,
	Document,
	FunctionCall,
	isContextStatement,
	isDefineFunction,
	isDefineStatement,
	isFunctionCall,
	isNestedDefineFunction,
	NestedDefineFunction,
} from './generated/ast.js';

import { createYantrixServices } from './langium/yantrix-module.js';

// Create services once (lazily)
let services: ReturnType<typeof createYantrixServices> | null = null;

function getServices() {
	if (!services) {
		services = createYantrixServices(EmptyFileSystem);
	}
	return services;
}

/**
 * Validate that there's no whitespace between function name and opening parenthesis.
 */
function validateFunctionCallNoWhitespace(node: FunctionCall | DefineFunction | NestedDefineFunction): void {
	const cstNode = node.$cstNode;
	if (!cstNode) return;

	// Check if the original text has whitespace between name and (
	const text = cstNode.text;
	const match = text.match(/^([a-z]\w*)\s+\(/i);
	if (match) {
		throw new Error(`No whitespace allowed between function name and parenthesis: "${text}"`);
	}
}

/**
 * Recursively traverse AST and validate all function-like nodes.
 * Skip properties starting with '$' to avoid circular references.
 */
function traverseAndValidateFunctions(node: AstNode): void {
	if (isFunctionCall(node) || isDefineFunction(node) || isNestedDefineFunction(node)) {
		validateFunctionCallNoWhitespace(node);
	}

	// Traverse children, skipping special properties ($ prefix)
	for (const [key, value] of Object.entries(node)) {
		// Skip internal Langium properties to avoid circular references
		if (key.startsWith('$')) {
			continue;
		}

		if (Array.isArray(value)) {
			for (const item of value) {
				if (item && typeof item === 'object' && '$type' in item) {
					traverseAndValidateFunctions(item as AstNode);
				}
			}
		} else if (value && typeof value === 'object' && '$type' in value) {
			traverseAndValidateFunctions(value as AstNode);
		}
	}
}

/**
 * Validate semantic constraints on the parsed document.
 */
function validateSemantics(doc: Document): void {
	for (const stmt of doc.statements) {
		if (isContextStatement(stmt)) {
			validateContextStatement(stmt);
		}
		if (isDefineStatement(stmt)) {
			validateDefineStatement(stmt);
		}
		// Traverse all statements to find function calls
		traverseAndValidateFunctions(stmt);
	}
}

/**
 * Validate that reducer has <= items than context.
 */
function validateContextStatement(ctx: ContextStatement): void {
	if (ctx.reducer && ctx.reducer.length > ctx.items.length) {
		throw new Error(
			'The number of arguments must be equal to or less than the number of context arguments.',
		);
	}
}

/**
 * Validate DefineStatement's expression if it's a function.
 */
function validateDefineStatement(def: DefineStatement): void {
	if (isDefineFunction(def.expression)) {
		validateFunctionCallNoWhitespace(def.expression);
	}
}

/**
 * Parse Yantrix DSL input string and return the AST Document.
 * @param input - The Yantrix DSL source code
 * @returns The parsed Document AST node
 */
export function parseYantrix(input: string): Document {
	const { Yantrix } = getServices();
	const parser = Yantrix.parser.LangiumParser;
	const result = parser.parse(input);

	if (result.lexerErrors.length > 0) {
		throw new Error(`Lexer errors: ${result.lexerErrors.map(e => e.message).join(', ')}`);
	}
	if (result.parserErrors.length > 0) {
		throw new Error(`Parser errors: ${result.parserErrors.map(e => e.message).join(', ')}`);
	}

	const doc = result.value as Document;
	validateSemantics(doc);
	return doc;
}

/**
 * YantrixParser class for backward compatibility with existing code.
 * Wraps the Langium parser with the same interface as the old Jison parser.
 */
export class YantrixParser {
	/**
	 * Parse Yantrix DSL input and return the AST.
	 * @param input - The Yantrix DSL source code
	 * @returns The parsed Document AST
	 */
	parse(input: string): Document {
		return parseYantrix(input);
	}
}
