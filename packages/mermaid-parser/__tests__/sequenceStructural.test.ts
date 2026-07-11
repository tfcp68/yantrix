import { describe, expect, it } from 'vitest';
import { parseSequenceStructural, SequenceStructuralError } from '../src';
import { BlankInputError, InvalidInputError } from '../src/sequence/errors/sequenceErrors.js';

describe('parseSequenceStructural', () => {
	describe('input validation', () => {
		it('rejects blank input', async () => {
			await expect(parseSequenceStructural('')).rejects.toThrow(BlankInputError);
			await expect(parseSequenceStructural('   \n ')).rejects.toThrow(BlankInputError);
		});

		it('rejects non-sequence input', async () => {
			await expect(parseSequenceStructural('invalidDiagram')).rejects.toThrow(InvalidInputError);
		});
	});

	describe('participants', () => {
		it('extracts declared participants with role aliases', async () => {
			const result = await parseSequenceStructural(`
sequenceDiagram
    participant UI as Source UI
    participant EventBus
    participant Log as Destination Log
    UI ->> EventBus: login
`);
			expect(result.participants).toEqual([
				{ name: 'UI', alias: 'Source UI', isActor: false, declared: true, location: { line: 3 } },
				{ name: 'EventBus', alias: null, isActor: false, declared: true, location: { line: 4 } },
				{ name: 'Log', alias: 'Destination Log', isActor: false, declared: true, location: { line: 5 } },
			]);
		});

		it('supports quoted multi-word aliases', async () => {
			const result = await parseSequenceStructural(`
sequenceDiagram
    participant UI as "Source UI"
    UI ->> B: m
`);
			expect(result.participants[0]!.alias).toContain('Source UI');
		});

		it('marks implicit participants as undeclared', async () => {
			const result = await parseSequenceStructural(`
sequenceDiagram
    A ->> B: m
`);
			expect(result.participants).toEqual([
				{ name: 'A', alias: null, isActor: false, declared: false, location: { line: 0 } },
				{ name: 'B', alias: null, isActor: false, declared: false, location: { line: 0 } },
			]);
		});

		it('flags actor declarations', async () => {
			const result = await parseSequenceStructural(`
sequenceDiagram
    actor Bob
    Bob ->> A: m
`);
			expect(result.participants[0]).toMatchObject({ name: 'Bob', isActor: true, declared: true });
		});
	});

	describe('messages', () => {
		it('extracts solid and dotted arrows with labels and locations', async () => {
			const result = await parseSequenceStructural(`
sequenceDiagram
    A ->> B: request
    B -->> A: response
`);
			expect(result.messages).toEqual([
				{
					from: 'A',
					to: 'B',
					label: 'request',
					arrow: 'solid',
					activation: 'none',
					noteIndex: null,
					blockPath: [],
					location: { line: 3 },
				},
				{
					from: 'B',
					to: 'A',
					label: 'response',
					arrow: 'dotted',
					activation: 'none',
					noteIndex: null,
					blockPath: [],
					location: { line: 4 },
				},
			]);
		});

		it('records activations', async () => {
			const result = await parseSequenceStructural(`
sequenceDiagram
    A ->>+ B: start
    B -->>- A: done
`);
			expect(result.messages[0]!.activation).toBe('activate');
			expect(result.messages[1]!.activation).toBe('deactivate');
		});

		it('supports self-loop messages', async () => {
			const result = await parseSequenceStructural(`
sequenceDiagram
    A ->> A: self
`);
			expect(result.messages[0]).toMatchObject({ from: 'A', to: 'A', label: 'self' });
		});

		it('rejects unsupported arrow kinds', async () => {
			await expect(parseSequenceStructural(`
sequenceDiagram
    A -x B: m
`)).rejects.toThrow(SequenceStructuralError);
			await expect(parseSequenceStructural(`
sequenceDiagram
    A -) B: m
`)).rejects.toThrow(/->>/);
		});
	});

	describe('notes and linking', () => {
		it('links a spanning note to the next consistent arrow', async () => {
			const result = await parseSequenceStructural(`
sequenceDiagram
    note over A, B: emit/login
    A ->> B: login
`);
			expect(result.notes[0]).toMatchObject({
				placement: 'over',
				first: 'A',
				second: 'B',
				text: 'emit/login',
				messageIndex: 0,
			});
			expect(result.messages[0]!.noteIndex).toBe(0);
		});

		it('links a side note by single endpoint', async () => {
			const result = await parseSequenceStructural(`
sequenceDiagram
    note right of B: subscribe/login
    A ->> B: login
`);
			expect(result.notes[0]).toMatchObject({ placement: 'rightOf', first: 'B', second: null, messageIndex: 0 });
		});

		it('links a note backward to the immediately preceding arrow', async () => {
			const result = await parseSequenceStructural(`
sequenceDiagram
    A ->> B: login
    note over A, B: emit/login
`);
			expect(result.notes[0]!.messageIndex).toBe(0);
			expect(result.messages[0]!.noteIndex).toBe(0);
		});

		it('prefers the preceding arrow over the following one', async () => {
			const result = await parseSequenceStructural(`
sequenceDiagram
    A ->> B: m1
    note over A, B: X
    A ->> B: m2
`);
			expect(result.notes[0]!.messageIndex).toBe(0);
			expect(result.messages[1]!.noteIndex).toBeNull();
		});

		it('leaves unmatched notes loose', async () => {
			const result = await parseSequenceStructural(`
sequenceDiagram
    A ->> B: m
    note over C: orphan
`);
			expect(result.notes[0]!.messageIndex).toBeNull();
			expect(result.messages[0]!.noteIndex).toBeNull();
		});

		it('does not link a note to an inconsistent arrow', async () => {
			const result = await parseSequenceStructural(`
sequenceDiagram
    note over C, D: for later
    A ->> B: m
    C ->> D: n
`);
			expect(result.notes[0]!.messageIndex).toBe(1);
			expect(result.messages[0]!.noteIndex).toBeNull();
			expect(result.messages[1]!.noteIndex).toBe(0);
		});

		it('preserves note text with subsyntax characters', async () => {
			const result = await parseSequenceStructural(`
sequenceDiagram
    note over A, B: emit/login ($name) <= @{user}
    A ->> B: login
`);
			expect(result.notes[0]!.text).toBe('emit/login ($name) <= @{user}');
		});
	});

	describe('blocks', () => {
		it('extracts alt/else with branch labels and message indices', async () => {
			const result = await parseSequenceStructural(`
sequenceDiagram
    alt success
        A ->> B: ok
    else failure
        A ->> B: fail
    end
`);
			expect(result.blocks).toEqual([
				{
					kind: 'alt',
					branches: [
						{ label: 'success', messageIndices: [0], blocks: [] },
						{ label: 'failure', messageIndices: [1], blocks: [] },
					],
					location: { line: 3 },
				},
			]);
			expect(result.messages[0]!.blockPath).toEqual(['alt:success']);
			expect(result.messages[1]!.blockPath).toEqual(['alt:failure']);
		});

		it('extracts loop, opt and par blocks', async () => {
			const result = await parseSequenceStructural(`
sequenceDiagram
    loop every second
        A ->> B: tick
    end
    opt maybe
        A ->> B: c
    end
    par one
        A ->> B: p1
    and two
        A ->> B: p2
    end
`);
			expect(result.blocks.map(b => b.kind)).toEqual(['loop', 'opt', 'par']);
			expect(result.blocks[2]!.branches.map(b => b.label)).toEqual(['one', 'two']);
			expect(result.messages[0]!.blockPath).toEqual(['loop:every second']);
		});

		it('supports nested blocks', async () => {
			const result = await parseSequenceStructural(`
sequenceDiagram
    alt outer
        loop inner
            A ->> B: m
        end
    end
`);
			const outer = result.blocks[0]!;
			expect(outer.kind).toBe('alt');
			expect(outer.branches[0]!.blocks[0]!.kind).toBe('loop');
			expect(result.messages[0]!.blockPath).toEqual(['alt:outer', 'loop:inner']);
		});

		it('rejects unsupported block kinds', async () => {
			await expect(parseSequenceStructural(`
sequenceDiagram
    critical c
        A ->> B: m
    end
`)).rejects.toThrow(/critical/);
			await expect(parseSequenceStructural(`
sequenceDiagram
    break b
        A ->> B: m
    end
`)).rejects.toThrow(/break/);
		});

		it('rejects create participant', async () => {
			await expect(parseSequenceStructural(`
sequenceDiagram
    A ->> B: m
    create participant C
    A ->> C: m
`)).rejects.toThrow(/create/);
		});
	});
});
