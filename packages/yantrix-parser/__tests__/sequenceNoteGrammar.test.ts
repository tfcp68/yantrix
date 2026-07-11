import { describe, expect, it } from 'vitest';
import {
	isDefineStatement,
	isInjectStatement,
	isSequenceEmitStatement,
	isSequencePacketStatement,
	isSequenceSubscribeStatement,
	parseYantrixSequenceNote,
} from '../src';

describe('sequence note grammar', () => {
	describe('accepted statements', () => {
		it('parses emit with meta and packet mapping', () => {
			const doc = parseYantrixSequenceNote(`emit/login ($tok, $exp='never') <= @{authToken}`);

			expect(doc.statements.length).toBe(1);
			const stmt = doc.statements[0]!;
			expect(isSequenceEmitStatement(stmt)).toBe(true);
			if (isSequenceEmitStatement(stmt)) {
				expect(stmt.identifier).toBe('login');
				expect(stmt.meta.length).toBe(2);
				expect(stmt.packet.length).toBe(1);
			}
		});

		it('parses subscribe without action (destination form)', () => {
			const doc = parseYantrixSequenceNote(`subscribe/login ($userName) <= ($name)`);

			const stmt = doc.statements[0]!;
			expect(isSequenceSubscribeStatement(stmt)).toBe(true);
			if (isSequenceSubscribeStatement(stmt)) {
				expect(stmt.identifier).toBe('login');
				expect(stmt.actionName).toBeUndefined();
				expect(stmt.payload.length).toBe(1);
				expect(stmt.metaItems.length).toBe(1);
			}
		});

		it('parses subscribe with action (automaton form)', () => {
			const doc = parseYantrixSequenceNote(`subscribe/login AUTHENTICATE ($userId) <= ($id)`);

			const stmt = doc.statements[0]!;
			expect(isSequenceSubscribeStatement(stmt)).toBe(true);
			if (isSequenceSubscribeStatement(stmt)) {
				expect(stmt.identifier).toBe('login');
				expect(stmt.actionName).toBe('AUTHENTICATE');
			}
		});

		it('parses bare subscribe without action or key lists', () => {
			const doc = parseYantrixSequenceNote(`subscribe/login`);

			const stmt = doc.statements[0]!;
			expect(isSequenceSubscribeStatement(stmt)).toBe(true);
			if (isSequenceSubscribeStatement(stmt)) {
				expect(stmt.actionName).toBeUndefined();
				expect(stmt.payload.length).toBe(0);
			}
		});

		it('parses packet reducer statement', () => {
			const doc = parseYantrixSequenceNote(`@{ line, count = 0 } <= $timestamp, add(@count, 1)`);

			const stmt = doc.statements[0]!;
			expect(isSequencePacketStatement(stmt)).toBe(true);
			if (isSequencePacketStatement(stmt)) {
				expect(stmt.items.length).toBe(2);
				expect(stmt.reducer.length).toBe(2);
			}
		});

		it('parses define and inject', () => {
			const doc = parseYantrixSequenceNote(`define/toUpper(s) => upper(s)\ninject/formatTime`);

			expect(doc.statements.length).toBe(2);
			expect(isDefineStatement(doc.statements[0]!)).toBe(true);
			expect(isInjectStatement(doc.statements[1]!)).toBe(true);
		});

		it('parses multiple newline-separated statements', () => {
			const doc = parseYantrixSequenceNote(`emit/login ($name) <= @{user}\nsubscribe/login ($userName) <= ($name)`);

			expect(doc.statements.length).toBe(2);
		});
	});

	describe('rejected statements (state-only)', () => {
		it('rejects +Init', () => {
			expect(() => parseYantrixSequenceNote(`+Init`)).toThrow();
		});

		it('rejects +ByPass', () => {
			expect(() => parseYantrixSequenceNote(`+ByPass`)).toThrow();
		});

		it('rejects expression statements', () => {
			expect(() => parseYantrixSequenceNote(`= add(1, 2) ?`)).toThrow();
		});

		it('rejects context statements (# is a mermaid comment char)', () => {
			expect(() => parseYantrixSequenceNote(`#{ a } <= $x`)).toThrow();
		});

		it('rejects context references inside expressions', () => {
			expect(() => parseYantrixSequenceNote(`@{ a } <= add(#b, 1)`)).toThrow(/not allowed in sequence/);
		});
	});

	describe('shared semantic validation', () => {
		it('rejects reducer with more items than packet keys', () => {
			expect(() => parseYantrixSequenceNote(`@{ a } <= $x, $y`)).toThrow();
		});

		it('rejects whitespace between function name and parenthesis', () => {
			expect(() => parseYantrixSequenceNote(`@{ a } <= add (1, 2)`)).toThrow();
		});
	});
});
