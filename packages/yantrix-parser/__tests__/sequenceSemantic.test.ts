import { describe, expect, it } from 'vitest';
import { ISequenceDiagnostic, parseSequenceDiagram } from '../src';

function kinds(diagnostics: ISequenceDiagnostic[]): string[] {
	return diagnostics.map(d => d.kind);
}

const BUS_DIAGRAM = `
sequenceDiagram
    participant UI as Source UI
    participant EventBus
    participant Log as Destination Log
    UI ->> EventBus: login
    note over UI, EventBus: emit/login ($name) <= @{user}
    EventBus ->> Log: login
    note over EventBus, Log: subscribe/login ($userName) <= ($name)
`;

describe('parseSequenceDiagram (semantic pass)', () => {
	describe('participants', () => {
		it('classifies roles from alias prefixes and reserved EventBus name', async () => {
			const { ast, diagnostics } = await parseSequenceDiagram(BUS_DIAGRAM);

			expect(diagnostics).toEqual([]);
			expect(ast.participants).toMatchObject([
				{ name: 'UI', kind: 'Source', displayName: 'UI', declared: true },
				{ name: 'EventBus', kind: 'EventBus', displayName: 'EventBus', declared: true },
				{ name: 'Log', kind: 'Destination', displayName: 'Log', declared: true },
			]);
			expect(ast.eventBus).toEqual({ declared: true, name: 'EventBus' });
		});

		it('classifies quoted aliases', async () => {
			const { ast } = await parseSequenceDiagram(`
sequenceDiagram
    participant UI as "Source Login Form"
    participant EventBus
    UI ->> EventBus: login
`);
			expect(ast.participants[0]).toMatchObject({ kind: 'Source', displayName: 'Login Form' });
		});

		it('rejects actors with a diagnostic', async () => {
			const { diagnostics } = await parseSequenceDiagram(`
sequenceDiagram
    actor Bob
    Bob ->> A: m
`);
			expect(kinds(diagnostics)).toContain('actor-not-supported');
		});

		it('rejects EventBus with a role prefix', async () => {
			const { diagnostics } = await parseSequenceDiagram(`
sequenceDiagram
    participant EventBus as Source EventBus
    A ->> EventBus: m
`);
			expect(kinds(diagnostics)).toContain('reserved-participant-name');
		});

		it('requires EventBus to be declared', async () => {
			const { diagnostics } = await parseSequenceDiagram(`
sequenceDiagram
    participant UI as Source UI
    UI ->> EventBus: login
`);
			expect(kinds(diagnostics)).toContain('event-bus-not-declared');
		});
	});

	describe('topology and event resolution', () => {
		it('classifies emit/subscribe arrows and resolves explicit names', async () => {
			const { ast } = await parseSequenceDiagram(BUS_DIAGRAM);

			expect(ast.messages[0]).toMatchObject({
				topology: 'emit',
				eventName: 'login',
				eventIsSynthetic: false,
			});
			expect(ast.messages[1]).toMatchObject({ topology: 'subscribe', eventName: 'login' });
			expect(ast.messages[0]!.statements.length).toBe(1);
		});

		it('resolves the event name from an identifier label (shortcut)', async () => {
			const { ast, diagnostics } = await parseSequenceDiagram(`
sequenceDiagram
    participant UI as Source UI
    participant EventBus
    participant Log as Destination Log
    UI ->> EventBus: login
    EventBus ->> Log: login
`);
			expect(diagnostics).toEqual([]);
			expect(ast.messages[0]!.eventName).toBe('login');
			expect(ast.messages[1]!.eventName).toBe('login');
		});

		it('reports a non-identifier label without explicit name', async () => {
			const { ast, diagnostics } = await parseSequenceDiagram(`
sequenceDiagram
    participant UI as Source UI
    participant EventBus
    UI ->> EventBus: user logs in!
`);
			expect(kinds(diagnostics)).toContain('missing-event-name');
			expect(ast.messages[0]!.eventName).toBeNull();
		});

		it('warns when an identifier label differs from the explicit name', async () => {
			const { ast, diagnostics } = await parseSequenceDiagram(`
sequenceDiagram
    participant UI as Source UI
    participant EventBus
    UI ->> EventBus: click
    note over UI, EventBus: emit/login
`);
			expect(kinds(diagnostics)).toContain('label-event-mismatch');
			expect(diagnostics.find(d => d.kind === 'label-event-mismatch')!.severity).toBe('warning');
			expect(ast.messages[0]!.eventName).toBe('login');
		});

		it('classifies descriptive arrows without wiring semantics', async () => {
			const { ast, diagnostics } = await parseSequenceDiagram(`
sequenceDiagram
    participant A
    participant B
    A ->> B: whatever text
`);
			expect(diagnostics).toEqual([]);
			expect(ast.messages[0]).toMatchObject({ topology: 'descriptive', eventName: null });
		});
	});

	describe('direct delivery', () => {
		it('synthesizes a hidden event and accepts a single packet reducer', async () => {
			const { ast, diagnostics } = await parseSequenceDiagram(`
sequenceDiagram
    participant Timer as Source Timer
    participant Log as Destination Log
    Timer ->> Log: tick
    note over Timer, Log: @{ line } <= $timestamp
`);
			expect(diagnostics).toEqual([]);
			expect(ast.messages[0]).toMatchObject({
				topology: 'direct',
				eventName: '__direct__Timer__Log__0',
				eventIsSynthetic: true,
			});
		});

		it('requires an inline reducer', async () => {
			const { diagnostics } = await parseSequenceDiagram(`
sequenceDiagram
    participant Timer as Source Timer
    participant Log as Destination Log
    Timer ->> Log: tick
`);
			expect(kinds(diagnostics)).toContain('missing-inline-reducer');
		});

		it('rejects multiple inline reducers', async () => {
			const { diagnostics } = await parseSequenceDiagram(`
sequenceDiagram
    participant Timer as Source Timer
    participant Log as Destination Log
    Timer ->> Log: tick
    note over Timer, Log: @{ a } <= $x<br/>@{ b } <= $y
`);
			expect(kinds(diagnostics)).toContain('multiple-inline-reducers');
		});

		it('rejects emit/subscribe statements on direct arrows', async () => {
			const { diagnostics } = await parseSequenceDiagram(`
sequenceDiagram
    participant Timer as Source Timer
    participant Log as Destination Log
    Timer ->> Log: tick
    note over Timer, Log: emit/tick
`);
			expect(kinds(diagnostics)).toContain('emit-without-bus');
		});
	});

	describe('role and placement validation', () => {
		it('rejects a Destination emitting into the bus', async () => {
			const { diagnostics } = await parseSequenceDiagram(`
sequenceDiagram
    participant Log as Destination Log
    participant EventBus
    Log ->> EventBus: oops
`);
			expect(kinds(diagnostics)).toContain('role-violation');
		});

		it('rejects a Source receiving from the bus', async () => {
			const { diagnostics } = await parseSequenceDiagram(`
sequenceDiagram
    participant UI as Source UI
    participant EventBus
    EventBus ->> UI: oops
`);
			expect(kinds(diagnostics)).toContain('role-violation');
		});

		it('rejects subscribe statements on emit arrows and vice versa', async () => {
			const { diagnostics } = await parseSequenceDiagram(`
sequenceDiagram
    participant UI as Source UI
    participant EventBus
    participant Log as Destination Log
    UI ->> EventBus: login
    note over UI, EventBus: subscribe/login
    EventBus ->> Log: login
    note over EventBus, Log: emit/login
`);
			expect(kinds(diagnostics)).toEqual(
				expect.arrayContaining(['subscribe-on-emit-arrow', 'emit-on-subscribe-arrow']),
			);
		});

		it('rejects packet reducers on bus arrows', async () => {
			const { diagnostics } = await parseSequenceDiagram(`
sequenceDiagram
    participant UI as Source UI
    participant EventBus
    UI ->> EventBus: login
    note over UI, EventBus: @{ a } <= $x
`);
			expect(kinds(diagnostics)).toContain('misplaced-packet-reducer');
		});

		it('warns about subscribe with action on a Destination arrow', async () => {
			const { diagnostics } = await parseSequenceDiagram(`
sequenceDiagram
    participant UI as Source UI
    participant EventBus
    participant Log as Destination Log
    UI ->> EventBus: login
    EventBus ->> Log: login
    note over EventBus, Log: subscribe/login AUTHENTICATE
`);
			const diagnostic = diagnostics.find(d => d.kind === 'destination-subscribe-with-action');
			expect(diagnostic).toBeDefined();
			expect(diagnostic!.severity).toBe('warning');
		});

		it('allows subscribe with action on generic participants (Kind B)', async () => {
			const { diagnostics } = await parseSequenceDiagram(`
sequenceDiagram
    participant UI as Source UI
    participant EventBus
    participant LoginFSM
    UI ->> EventBus: login
    EventBus ->> LoginFSM: login
    note over EventBus, LoginFSM: subscribe/login AUTHENTICATE ($userId) <= ($id)
`);
			expect(diagnostics).toEqual([]);
		});
	});

	describe('event coverage', () => {
		it('warns about subscriptions to never-emitted events', async () => {
			const { diagnostics } = await parseSequenceDiagram(`
sequenceDiagram
    participant EventBus
    participant Log as Destination Log
    EventBus ->> Log: ghostEvent
`);
			const diagnostic = diagnostics.find(d => d.kind === 'unknown-event');
			expect(diagnostic).toBeDefined();
			expect(diagnostic!.severity).toBe('warning');
		});

		it('accepts externally known events from options.eventDictionary', async () => {
			const { diagnostics } = await parseSequenceDiagram(`
sequenceDiagram
    participant EventBus
    participant Log as Destination Log
    EventBus ->> Log: ghostEvent
`, { eventDictionary: { ghostEvent: null } });
			expect(diagnostics).toEqual([]);
		});
	});

	describe('notes, blocks and subsyntax errors', () => {
		it('normalizes <br/> and keeps loose notes with statements', async () => {
			const { ast } = await parseSequenceDiagram(`
sequenceDiagram
    participant A
    note over A: define/toUpper(s) => upper(s)<br/>inject/formatTime
`);
			expect(ast.looseNotes.length).toBe(1);
			expect(ast.looseNotes[0]!.statements.length).toBe(2);
		});

		it('reports unparseable note subsyntax', async () => {
			const { diagnostics } = await parseSequenceDiagram(`
sequenceDiagram
    participant UI as Source UI
    participant EventBus
    UI ->> EventBus: login
    note over UI, EventBus: emit/login (((
`);
			expect(kinds(diagnostics)).toContain('syntax-error');
		});

		it('preserves blocks and block paths', async () => {
			const { ast, diagnostics } = await parseSequenceDiagram(`
sequenceDiagram
    participant UI as Source UI
    participant EventBus
    participant Log as Destination Log
    UI ->> EventBus: login
    alt success
        EventBus ->> Log: loginOk
    else failure
        EventBus ->> Log: loginFail
    end
`);
			expect(diagnostics.filter(d => d.severity === 'error')).toEqual([]);
			expect(ast.blocks[0]!.kind).toBe('alt');
			expect(ast.blocks[0]!.branches.map(b => b.label)).toEqual(['success', 'failure']);
			expect(ast.messages[1]!.blockPath).toEqual(['alt:success']);
			expect(ast.messages[2]!.blockPath).toEqual(['alt:failure']);
		});
	});
});
