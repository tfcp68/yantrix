/**
 * Test fixtures for key items in Langium AST.
 */

import { RawKeyItem } from '../../src/generated/ast.js';

/**
 * Create a mock RawKeyItem for testing.
 */
export function createRawKeyItem(identifier: string, _hasDefault: boolean = false): Partial<RawKeyItem> {
	return {
		$type: 'RawKeyItem',
		identifier,
	};
}
