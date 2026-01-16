import { Document } from '../../src/generated/ast.js';

export function expectStatementCount(doc: Document, count: number): void {
	if (doc.statements.length !== count) {
		throw new Error(`Expected ${count} statements, got ${doc.statements.length}`);
	}
}
