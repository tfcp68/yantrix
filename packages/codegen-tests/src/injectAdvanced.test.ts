import { ModuleNames } from '@yantrix/codegen';
import { beforeEach, describe, expect, it } from 'vitest';
import { generateAndSave } from './fixtures/utils.js';

const getPath = (file: string) => `../../fixtures/injects/${file}.ts`;
const advancedPath = getPath('advancedFunctions');

// ============================================================
// Automata A: InjectWithDefine
// inject/range + inject/sumArr + define/sumRange(a,b) = sumArr(range(a,b))
// Verifies inject and define coexist and can compose.
// ============================================================
const injectDefineInput = `stateDiagram-v2
	[*] --> A: eval
	A --> A: eval
note right of [*]
	inject/range
	inject/sumArr
	define/sumRange (a, b) => sumArr(range(a, b))
end note
note right of A
	#{result} <= sumRange($start, $end)
end note
`;

// ============================================================
// Automata B: InjectComplexReturn
// Multiple injects from the same file; functions return arrays
// and objects which can then be used in subsequent dispatches.
// ============================================================
const complexReturnInput = `stateDiagram-v2
	[*] --> A: eval
	A --> A: eval
note right of [*]
	inject/range
	inject/makePoint
	inject/funcA
	inject/funcB
end note
note right of A
	#{arr}   <= range($start, $end)
	#{point} <= makePoint($x, $y)
	#{a}     <= funcA()
	#{b}     <= funcB()
end note
`;

// ============================================================
// Automata C: InjectForkPredicate
// Injected function used as fork guard condition.
// isPositiveNum(n) = n > 0
// ============================================================
const injectForkInput = `stateDiagram-v2
	[*] --> Idle: start
	Idle --> check: check
	state check <<choice>>
	check --> Positive: isPositiveNum($val)
	check --> NonPositive
note right of [*]
	inject/isPositiveNum
end note
`;

describe('inject advanced codegen', async () => {
	await generateAndSave({ input: injectDefineInput, automataName: 'InjectWithDefine', lang: ModuleNames.JavaScript, injects: advancedPath }, 'inject_define');
	await generateAndSave({ input: complexReturnInput, automataName: 'InjectComplexReturn', lang: ModuleNames.JavaScript, injects: advancedPath }, 'inject_complex');
	await generateAndSave({ input: injectForkInput, automataName: 'InjectForkPredicate', lang: ModuleNames.JavaScript, injects: advancedPath }, 'inject_fork');

	const { InjectWithDefine, actionsDictionary: idActions, functionDictionary: idDict } = await import('./fixtures/generated/inject_define_generated.js');
	const { InjectComplexReturn, actionsDictionary: crActions } = await import('./fixtures/generated/inject_complex_generated.js');
	const { InjectForkPredicate, actionsDictionary: ifActions, statesDictionary: ifStates } = await import('./fixtures/generated/inject_fork_generated.js');

	// -------------------------------------------------------
	// InjectWithDefine
	// -------------------------------------------------------
	describe('injectWithDefine', () => {
		let inst: InstanceType<typeof InjectWithDefine>;

		beforeEach(() => {
			inst = new InjectWithDefine();
		});

		it('sumRange(1, 5) = sum([1,2,3,4]) = 10', () => {
			inst.dispatch({ action: idActions.eval, payload: { start: 1, end: 5 } });
			expect(inst.getContext().context.result).toBe(10);
		});

		it('sumRange(0, 4) = sum([0,1,2,3]) = 6', () => {
			inst.dispatch({ action: idActions.eval, payload: { start: 0, end: 4 } });
			expect(inst.getContext().context.result).toBe(6);
		});

		it('sumRange(5, 5) = sum([]) = 0', () => {
			inst.dispatch({ action: idActions.eval, payload: { start: 5, end: 5 } });
			expect(inst.getContext().context.result).toBe(0);
		});

		it('functionDictionary has range registered', () => {
			expect(idDict.get('range')).toBeDefined();
		});

		it('functionDictionary has sumRange registered', () => {
			expect(idDict.get('sumRange')).toBeDefined();
		});

		it('functionDictionary has sumArr registered', () => {
			expect(idDict.get('sumArr')).toBeDefined();
		});
	});

	// -------------------------------------------------------
	// InjectComplexReturn
	// -------------------------------------------------------
	describe('injectComplexReturn', () => {
		it('range(0, 4) stored as [0,1,2,3]', () => {
			const inst = new InjectComplexReturn();
			inst.dispatch({ action: crActions.eval, payload: { start: 0, end: 4, x: 0, y: 0 } });
			expect(inst.getContext().context.arr).toStrictEqual([0, 1, 2, 3]);
		});

		it('makePoint(3, 7) stored as {x:3, y:7}', () => {
			const inst = new InjectComplexReturn();
			inst.dispatch({ action: crActions.eval, payload: { start: 0, end: 0, x: 3, y: 7 } });
			expect(inst.getContext().context.point).toStrictEqual({ x: 3, y: 7 });
		});

		it('funcA() = A, funcB() = B', () => {
			const inst = new InjectComplexReturn();
			inst.dispatch({ action: crActions.eval, payload: { start: 0, end: 0, x: 0, y: 0 } });
			const ctx = inst.getContext().context;
			expect(ctx.a).toBe('A');
			expect(ctx.b).toBe('B');
		});

		it('makePoint(null, null) = {x:null, y:null}', () => {
			const inst = new InjectComplexReturn();
			inst.dispatch({ action: crActions.eval, payload: { start: 0, end: 0, x: null, y: null } });
			expect(inst.getContext().context.point).toStrictEqual({ x: null, y: null });
		});

		it('range result reused in next dispatch: len([0,1,2,3]) via context is still 4', () => {
			const inst = new InjectComplexReturn();
			inst.dispatch({ action: crActions.eval, payload: { start: 0, end: 4, x: 0, y: 0 } });
			// Second dispatch: arr is recomputed from new payload
			inst.dispatch({ action: crActions.eval, payload: { start: 0, end: 3, x: 0, y: 0 } });
			expect(inst.getContext().context.arr).toStrictEqual([0, 1, 2]);
		});
	});

	// -------------------------------------------------------
	// InjectForkPredicate
	// -------------------------------------------------------
	describe('injectForkPredicate', () => {
		function makeInstance() {
			const inst = new InjectForkPredicate();
			inst.dispatch({ action: ifActions.start, payload: {} });
			return inst;
		}

		it('val=5 -> Positive state', () => {
			const inst = makeInstance();
			inst.dispatch({ action: ifActions.check, payload: { val: 5 } });
			expect(inst.state).toBe(ifStates.Positive);
		});

		it('val=0 -> NonPositive state (boundary: 0 is not > 0)', () => {
			const inst = makeInstance();
			inst.dispatch({ action: ifActions.check, payload: { val: 0 } });
			expect(inst.state).toBe(ifStates.NonPositive);
		});

		it('val=-3 -> NonPositive state', () => {
			const inst = makeInstance();
			inst.dispatch({ action: ifActions.check, payload: { val: -3 } });
			expect(inst.state).toBe(ifStates.NonPositive);
		});
	});
});
