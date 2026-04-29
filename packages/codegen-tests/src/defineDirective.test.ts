import { ModuleNames } from '@yantrix/codegen';
import { beforeEach, describe, expect, it } from 'vitest';
import { generateAndSave } from './fixtures/utils.js';

// ============================================================
// Automata A: DefineExtended
// Tests constant-literal return and 3-level define chain.
// step3(x) -> step2(x+0) -> step1(x*2) -> x*2+1
// ============================================================
const extendedInput = `stateDiagram-v2
	[*] --> A: eval
	A --> A: eval
note left of [*]
	define/constVal () => 42
	define/step1 (x) => add(x, 1)
	define/step2 (x) => step1(mult(x, 2))
	define/step3 (x) => step2(add(x, 0))
end note
note left of A
	#{constVal_r} <= constVal()
	#{chain_r}    <= step3($n)
end note
`;

// ============================================================
// Automata B: DefineForkPredicate
// define used as fork guard condition.
// isValid(x) = isGreater(x, 0)
// ============================================================
const forkInput = `stateDiagram-v2
	[*] --> Idle: start
	Idle --> check: validate
	state check <<choice>>
	check --> Valid: isValid($amount)
	check --> Invalid
note left of [*]
	define/isValid (x) => isGreater(x, 0)
end note
`;

// ============================================================
// Automata C: DefineMultiState
// Same defined function referenced across multiple states.
// double(x) = mult(x, 2)
// State A: #{val} <= double($input)
// State B: #{val} <= double(#val)  (from prevContext)
// ============================================================
// [*] uses 'start' and A-->B uses 'step' to avoid the serializer's reset-action
// merge, which adds a spurious A-->A fork when both transitions share the same action name.
const multiStateInput = `stateDiagram-v2
	[*] --> A: start
	A --> B: step
note left of [*]
	define/double (x) => mult(x, 2)
end note
note left of A
	#{val} <= double($input)
end note
note left of B
	#{val} <= double(#val)
end note
`;

describe('define directive codegen', async () => {
	await generateAndSave({ input: extendedInput, automataName: 'DefineExtended', lang: ModuleNames.JavaScript }, 'define_extended');
	await generateAndSave({ input: forkInput, automataName: 'DefineForkPredicate', lang: ModuleNames.JavaScript }, 'define_fork');
	await generateAndSave({ input: multiStateInput, automataName: 'DefineMultiState', lang: ModuleNames.JavaScript }, 'define_multistate');

	const { DefineExtended, actionsDictionary: extActions } = await import('./fixtures/generated/define_extended_generated.js');
	const { DefineForkPredicate, actionsDictionary: forkActions, statesDictionary: forkStates } = await import('./fixtures/generated/define_fork_generated.js');
	const { DefineMultiState, actionsDictionary: msActions } = await import('./fixtures/generated/define_multistate_generated.js');

	// -------------------------------------------------------
	// DefineExtended
	// -------------------------------------------------------
	describe('defineExtended', () => {
		let ext: InstanceType<typeof DefineExtended>;

		beforeEach(() => {
			ext = new DefineExtended();
		});

		it('define/constVal () => 42 returns 42', () => {
			ext.dispatch({ action: extActions.eval, payload: { n: 0 } });
			expect(ext.getContext().context.constVal_r).toBe(42);
		});

		it('define/constVal is stable across dispatches', () => {
			ext.dispatch({ action: extActions.eval, payload: { n: 5 } });
			ext.dispatch({ action: extActions.eval, payload: { n: 5 } });
			expect(ext.getContext().context.constVal_r).toBe(42);
		});

		it('3-level chain step3(3) = 7', () => {
			// step3(3) = step2(3+0)=step2(3) = step1(3*2)=step1(6) = 6+1 = 7
			ext.dispatch({ action: extActions.eval, payload: { n: 3 } });
			expect(ext.getContext().context.chain_r).toBe(7);
		});

		it('3-level chain step3(0) = 1', () => {
			// step3(0) = step2(0)=step1(0)=0+1=1
			ext.dispatch({ action: extActions.eval, payload: { n: 0 } });
			expect(ext.getContext().context.chain_r).toBe(1);
		});

		it('3-level chain step3(5) = 11', () => {
			// step3(5)=step2(5)=step1(10)=11
			ext.dispatch({ action: extActions.eval, payload: { n: 5 } });
			expect(ext.getContext().context.chain_r).toBe(11);
		});

		it('step3(null) throws TypeError (mult rejects null)', () => {
			expect(() => ext.dispatch({ action: extActions.eval, payload: { n: null } })).toThrow(TypeError);
		});
	});

	// -------------------------------------------------------
	// DefineForkPredicate
	// -------------------------------------------------------
	describe('defineForkPredicate', () => {
		it('amount > 0 -> Valid state', async () => {
			const fork = new DefineForkPredicate();
			fork.dispatch({ action: forkActions.start, payload: {} });
			fork.dispatch({ action: forkActions.validate, payload: { amount: 5 } });
			expect(fork.state).toBe(forkStates.Valid);
		});

		it('amount < 0 -> Invalid state', async () => {
			const fork = new DefineForkPredicate();
			fork.dispatch({ action: forkActions.start, payload: {} });
			fork.dispatch({ action: forkActions.validate, payload: { amount: -1 } });
			expect(fork.state).toBe(forkStates.Invalid);
		});

		it('amount = 0 -> Invalid state (boundary: 0 is not > 0)', async () => {
			const fork = new DefineForkPredicate();
			fork.dispatch({ action: forkActions.start, payload: {} });
			fork.dispatch({ action: forkActions.validate, payload: { amount: 0 } });
			expect(fork.state).toBe(forkStates.Invalid);
		});
	});

	// -------------------------------------------------------
	// DefineMultiState
	// -------------------------------------------------------
	describe('defineMultiState', () => {
		it('state A: double($input=3) -> val=6', () => {
			const ms = new DefineMultiState();
			ms.dispatch({ action: msActions.start, payload: { input: 3 } });
			expect(ms.getContext().context.val).toBe(6);
		});

		it('state B: double(#val) where #val=6 from A -> val=12', () => {
			const ms = new DefineMultiState();
			ms.dispatch({ action: msActions.start, payload: { input: 3 } }); // A: val=6
			ms.dispatch({ action: msActions.step, payload: {} }); // B: val=double(6)=12
			expect(ms.getContext().context.val).toBe(12);
		});

		it('double($input=10) in A -> val=20, B doubles again -> val=40', () => {
			const ms = new DefineMultiState();
			ms.dispatch({ action: msActions.start, payload: { input: 10 } });
			ms.dispatch({ action: msActions.step, payload: {} });
			expect(ms.getContext().context.val).toBe(40);
		});

		it('double(null) in A throws TypeError (mult rejects null)', () => {
			const ms = new DefineMultiState();
			expect(() => ms.dispatch({ action: msActions.start, payload: { input: null } })).toThrow(TypeError);
		});
	});
});
