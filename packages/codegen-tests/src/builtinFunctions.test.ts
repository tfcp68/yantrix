import { ModuleNames } from '@yantrix/codegen';
import { beforeEach, describe, expect, it } from 'vitest';
import { generateAndSave } from './fixtures/utils.js';

// ============================================================
// Automata A: ValueFunctions
// Two states: Fn (strict scalar/boolean functions) and NullSafe
// (null-tolerant functions). Distinct payload keys per function
// to avoid type conflicts between test cases.
// ============================================================
const valueInput = `stateDiagram-v2
	[*] --> Fn: eval
	Fn --> NullSafe: evalNull
note left of Fn
	#{diff_r}    <= diff($dA, $dB)
	#{mod_r}     <= mod($mA, $mB)
	#{trunc_r}   <= trunc($tn)
	#{ceil_r}    <= ceil($cn)
	#{dec_r}     <= dec($dn)
	#{neg_r}     <= neg($ngn)
	#{inv_r}     <= inv($ivn)
	#{pow_r}     <= pow($pwBase, $pwExp)
	#{isGt_r}    <= isGreater($cmpA, $cmpB)
	#{isLt_r}    <= isLess($cmpA, $cmpB)
	#{isGte_r}   <= isGreaterOrEqual($cmpA, $cmpB)
	#{isLte_r}   <= isLessOrEqual($cmpA, $cmpB)
	#{isEven_r}  <= isEven($pn)
	#{isOdd_r}   <= isOdd($pn)
	#{isInt_r}   <= isInteger($pn)
	#{isPos_r}   <= isPositive($pn)
	#{isNeg_r}   <= isNegative($pn)
	#{and_r}     <= and($lP, $lQ)
	#{or_r}      <= or($lP, $lQ)
	#{none_r}    <= none($lP, $lQ)
	#{if_r}      <= if($ifCond, $ifT, $ifF)
	#{case_r}    <= case($cc1, $cv1, $cc2, $cv2, $cdef)
	#{choose_r}  <= choose($chIdx, $cho1, $cho2, $cho3)
	#{repeat_r}  <= repeat($rs, $rn)
	#{padL_r}    <= padLeft($ps, $plen, $pch)
	#{padR_r}    <= padRight($ps, $plen, $pch)
	#{substr_r}  <= substr($ss, $sstart, $send)
	#{lenStr_r}  <= len($lstr)
	#{sin_r}     <= sin($angle)
	#{cos_r}     <= cos($angle)
	#{ln_r}      <= ln($logn)
	#{lg_r}      <= lg($logn)
end note
note left of NullSafe
	#{isNull_r}       <= isNull($v)
	#{has_r}          <= has($obj, $hkey)
	#{and_null_r}     <= and($lP, $lQ)
	#{or_null_r}      <= or($lP, $lQ)
	#{none_null_r}    <= none($lP, $lQ)
	#{if_null_r}      <= if($ifCond, $ifT, $ifF)
	#{coalesce_r}     <= coalesce($coal1, $coal2, $coal3)
	#{len_null_r}     <= len($lstr)
end note
`;

// ============================================================
// Automata B: CollectionFunctions
// One self-looping state covering all array/object operations.
// makeColPayload() factory creates fresh objects each call to
// prevent lodash mutation side effects (_.set, _.reverse, _.merge).
// ============================================================
// Each mutating function (setAttr/_.set, merge/_.merge, reverse/_.reverse) gets
// its own payload key so mutations don't bleed into sibling computations.
const collInput = `stateDiagram-v2
	[*] --> Coll: eval
	Coll --> Coll: eval
note left of Coll
	#{min_r}      <= min($cNums=[])
	#{med_r}      <= med($cNums=[])
	#{sumsq_r}    <= sumsq($cNums=[])
	#{setAttr_r}  <= setAttr($saObj, $saPath, $saVal)
	#{omit_r}     <= omit($cObj, $cKey)
	#{pick_r}     <= pick($cObj, $cKey)
	#{merge_r}    <= merge($mBase, $mPatch)
	#{pluck_r}    <= pluck($cItems=[], $cProp)
	#{filterBy_r} <= filterBy($cItems=[], $cProp, $cFilterVal)
	#{find_r}     <= find($cItems=[], $cProp, $cFilterVal)
	#{sample_r}   <= sample($cArr=[], $cN)
	#{sort_r}     <= sort($cArr=[])
	#{left_r}     <= left($cArr=[], $cN)
	#{right_r}    <= right($cArr=[], $cN)
	#{indexOf_r}  <= indexOf($cArr=[], $cTarget)
	#{lenArr_r}   <= len($cArr=[])
	#{reverse_r}  <= reverse($revArr=[])
	#{keys_r}     <= keys($cObj)
	#{values_r}   <= values($cObj)
	#{isEq_r}     <= isEqual($eqA, $eqB)
end note
`;

describe('builtin functions codegen', async () => {
	await generateAndSave({ input: valueInput, automataName: 'ValueFunctions', lang: ModuleNames.JavaScript }, 'builtinValue');
	await generateAndSave({ input: collInput, automataName: 'CollectionFunctions', lang: ModuleNames.JavaScript }, 'builtinCollection');

	const { ValueFunctions, actionsDictionary: vActions } = await import('./fixtures/generated/builtinValue_generated.js');
	const { CollectionFunctions, actionsDictionary: cActions } = await import('./fixtures/generated/builtinCollection_generated.js');

	// -------------------------------------------------------
	// ValueFunctions helpers
	// -------------------------------------------------------
	// Base payload covering all Fn-state keys with safe defaults.
	const fnBase = {
		dA: 0,
		dB: 0,
		mA: 1,
		mB: 1,
		tn: 0,
		cn: 0,
		dn: 0,
		ngn: 0,
		ivn: 1,
		pwBase: 1,
		pwExp: 1,
		cmpA: 0,
		cmpB: 0,
		pn: 0,
		lP: false,
		lQ: false,
		ifCond: false,
		ifT: 'y',
		ifF: 'n',
		cc1: false,
		cv1: 'v1',
		cc2: false,
		cv2: 'v2',
		cdef: 'def',
		chIdx: 0,
		cho1: 'a',
		cho2: 'b',
		cho3: 'c',
		rs: '',
		rn: 0,
		ps: '',
		plen: 0,
		pch: ' ',
		ss: '',
		sstart: 0,
		send: 0,
		lstr: '',
		angle: 0,
		logn: 1,
	};

	// Base payload for NullSafe state (no numeric strict args).
	const nullBase = {
		v: null,
		obj: null,
		hkey: 'k',
		lP: null,
		lQ: null,
		ifCond: null,
		ifT: 'y',
		ifF: 'n',
		coal1: null,
		coal2: null,
		coal3: 'fallback',
		lstr: null,
	};

	let vInstance: InstanceType<typeof ValueFunctions>;

	beforeEach(() => {
		vInstance = new ValueFunctions();
	});

	function dispatchFn(override: Record<string, unknown>) {
		vInstance.dispatch({ action: vActions.eval, payload: { ...fnBase, ...override } });
		return vInstance.getContext().context;
	}

	function dispatchNull(override: Record<string, unknown>) {
		vInstance.dispatch({ action: vActions.eval, payload: fnBase });
		vInstance.dispatch({ action: vActions.evalNull, payload: { ...nullBase, ...override } });
		return vInstance.getContext().context;
	}

	// -------------------------------------------------------
	// Arithmetic
	// -------------------------------------------------------
	describe('diff', () => {
		it('diff(5, 3) = b-a = -2', () => {
			expect(dispatchFn({ dA: 5, dB: 3 }).diff_r).toBe(-2);
		});
		it('diff(3, 5) = b-a = 2', () => {
			expect(dispatchFn({ dA: 3, dB: 5 }).diff_r).toBe(2);
		});
		it('diff(null, 3) throws TypeError', () => {
			expect(() => vInstance.dispatch({ action: vActions.eval, payload: { ...fnBase, dA: null } })).toThrow(TypeError);
		});
	});

	describe('mod', () => {
		it('mod(10, 3) = 1', () => {
			expect(dispatchFn({ mA: 10, mB: 3 }).mod_r).toBe(1);
		});
		it('mod(null, 3) throws TypeError', () => {
			expect(() => vInstance.dispatch({ action: vActions.eval, payload: { ...fnBase, mA: null } })).toThrow(TypeError);
		});
	});

	describe('trunc', () => {
		it('trunc(1.9) = 1', () => expect(dispatchFn({ tn: 1.9 }).trunc_r).toBe(1));
		it('trunc(-1.9) = -1', () => expect(dispatchFn({ tn: -1.9 }).trunc_r).toBe(-1));
	});

	describe('ceil', () => {
		it('ceil(1.1) = 2', () => expect(dispatchFn({ cn: 1.1 }).ceil_r).toBe(2));
		it('ceil(-1.1) = -1', () => expect(dispatchFn({ cn: -1.1 }).ceil_r).toBe(-1));
	});

	describe('dec', () => {
		it('dec(5) = 4', () => expect(dispatchFn({ dn: 5 }).dec_r).toBe(4));
	});

	describe('neg', () => {
		it('neg(5) = -5', () => expect(dispatchFn({ ngn: 5 }).neg_r).toBe(-5));
		it('neg(-3) = 3', () => expect(dispatchFn({ ngn: -3 }).neg_r).toBe(3));
	});

	describe('inv', () => {
		it('inv(4) = 0.25', () => expect(dispatchFn({ ivn: 4 }).inv_r).toBe(0.25));
		it('inv(2) = 0.5', () => expect(dispatchFn({ ivn: 2 }).inv_r).toBe(0.5));
	});

	describe('pow', () => {
		it('pow(2, 10) = 1024', () => expect(dispatchFn({ pwBase: 2, pwExp: 10 }).pow_r).toBe(1024));
		it('pow(4, 0.5) = 2', () => expect(dispatchFn({ pwBase: 4, pwExp: 0.5 }).pow_r).toBe(2));
	});

	// -------------------------------------------------------
	// Comparison predicates
	// -------------------------------------------------------
	describe('isGreater', () => {
		it('isGreater(5, 3) = true', () => expect(dispatchFn({ cmpA: 5, cmpB: 3 }).isGt_r).toBe(true));
		it('isGreater(3, 5) = false', () => expect(dispatchFn({ cmpA: 3, cmpB: 5 }).isGt_r).toBe(false));
		it('isGreater(3, 3) = false (boundary)', () => expect(dispatchFn({ cmpA: 3, cmpB: 3 }).isGt_r).toBe(false));
		it('isGreater(null, 3) throws', () => {
			expect(() => vInstance.dispatch({ action: vActions.eval, payload: { ...fnBase, cmpA: null } })).toThrow(TypeError);
		});
	});

	describe('isLess', () => {
		it('isLess(3, 5) = true', () => expect(dispatchFn({ cmpA: 3, cmpB: 5 }).isLt_r).toBe(true));
		it('isLess(5, 3) = false', () => expect(dispatchFn({ cmpA: 5, cmpB: 3 }).isLt_r).toBe(false));
		it('isLess(3, 3) = false (boundary)', () => expect(dispatchFn({ cmpA: 3, cmpB: 3 }).isLt_r).toBe(false));
	});

	describe('isGreaterOrEqual', () => {
		it('isGreaterOrEqual(3, 3) = true', () => expect(dispatchFn({ cmpA: 3, cmpB: 3 }).isGte_r).toBe(true));
		it('isGreaterOrEqual(5, 3) = true', () => expect(dispatchFn({ cmpA: 5, cmpB: 3 }).isGte_r).toBe(true));
		it('isGreaterOrEqual(2, 3) = false', () => expect(dispatchFn({ cmpA: 2, cmpB: 3 }).isGte_r).toBe(false));
	});

	describe('isLessOrEqual', () => {
		it('isLessOrEqual(3, 3) = true', () => expect(dispatchFn({ cmpA: 3, cmpB: 3 }).isLte_r).toBe(true));
		it('isLessOrEqual(2, 3) = true', () => expect(dispatchFn({ cmpA: 2, cmpB: 3 }).isLte_r).toBe(true));
		it('isLessOrEqual(5, 3) = false', () => expect(dispatchFn({ cmpA: 5, cmpB: 3 }).isLte_r).toBe(false));
	});

	describe('isEven / isOdd', () => {
		it('isEven(4) = true', () => expect(dispatchFn({ pn: 4 }).isEven_r).toBe(true));
		it('isEven(3) = false', () => expect(dispatchFn({ pn: 3 }).isEven_r).toBe(false));
		it('isOdd(3) = true', () => expect(dispatchFn({ pn: 3 }).isOdd_r).toBe(true));
		it('isOdd(4) = false', () => expect(dispatchFn({ pn: 4 }).isOdd_r).toBe(false));
		it('isEven(null) throws', () => {
			expect(() => vInstance.dispatch({ action: vActions.eval, payload: { ...fnBase, pn: null } })).toThrow(TypeError);
		});
	});

	describe('isInteger', () => {
		it('isInteger(3) = true', () => expect(dispatchFn({ pn: 3 }).isInt_r).toBe(true));
		it('isInteger(3.1) = false', () => expect(dispatchFn({ pn: 3.1 }).isInt_r).toBe(false));
	});

	describe('isPositive / isNegative', () => {
		it('isPositive(1) = true', () => expect(dispatchFn({ pn: 1 }).isPos_r).toBe(true));
		it('isPositive(-1) = false', () => expect(dispatchFn({ pn: -1 }).isPos_r).toBe(false));
		it('isPositive(0) = false', () => expect(dispatchFn({ pn: 0 }).isPos_r).toBe(false));
		it('isNegative(-1) = true', () => expect(dispatchFn({ pn: -1 }).isNeg_r).toBe(true));
		it('isNegative(1) = false', () => expect(dispatchFn({ pn: 1 }).isNeg_r).toBe(false));
	});

	// -------------------------------------------------------
	// Logical predicates
	// -------------------------------------------------------
	describe('and', () => {
		it('and(true, true) = true', () => expect(dispatchFn({ lP: true, lQ: true }).and_r).toBe(true));
		it('and(true, false) = false', () => expect(dispatchFn({ lP: true, lQ: false }).and_r).toBe(false));
		it('and(false, false) = false', () => expect(dispatchFn({ lP: false, lQ: false }).and_r).toBe(false));
	});

	describe('or', () => {
		it('or(false, true) = true', () => expect(dispatchFn({ lP: false, lQ: true }).or_r).toBe(true));
		it('or(false, false) = false', () => expect(dispatchFn({ lP: false, lQ: false }).or_r).toBe(false));
	});

	describe('none', () => {
		it('none(false, false) = true', () => expect(dispatchFn({ lP: false, lQ: false }).none_r).toBe(true));
		it('none(true, false) = false', () => expect(dispatchFn({ lP: true, lQ: false }).none_r).toBe(false));
	});

	// -------------------------------------------------------
	// Conditionals
	// -------------------------------------------------------
	describe('if', () => {
		it('if(true, y, n) = y', () => expect(dispatchFn({ ifCond: true, ifT: 'yes', ifF: 'no' }).if_r).toBe('yes'));
		it('if(false, y, n) = n', () => expect(dispatchFn({ ifCond: false, ifT: 'yes', ifF: 'no' }).if_r).toBe('no'));
	});

	describe('case', () => {
		it('case: first branch matches', () => expect(dispatchFn({ cc1: true, cv1: 'x', cc2: false, cv2: 'y', cdef: 'def' }).case_r).toBe('x'));
		it('case: second branch matches', () => expect(dispatchFn({ cc1: false, cv1: 'x', cc2: true, cv2: 'y', cdef: 'def' }).case_r).toBe('y'));
		it('case: fallback when no branch matches', () => expect(dispatchFn({ cc1: false, cv1: 'x', cc2: false, cv2: 'y', cdef: 'def' }).case_r).toBe('def'));
	});

	describe('choose', () => {
		it('choose(0, a, b, c) = a', () => expect(dispatchFn({ chIdx: 0, cho1: 'a', cho2: 'b', cho3: 'c' }).choose_r).toBe('a'));
		it('choose(2, a, b, c) = c', () => expect(dispatchFn({ chIdx: 2, cho1: 'a', cho2: 'b', cho3: 'c' }).choose_r).toBe('c'));
	});

	// -------------------------------------------------------
	// String functions
	// -------------------------------------------------------
	describe('repeat', () => {
		it('repeat(ab, 3) = ababab', () => expect(dispatchFn({ rs: 'ab', rn: 3 }).repeat_r).toBe('ababab'));
	});

	describe('padLeft / padRight', () => {
		it('padLeft(x, 4, 0) = 000x', () => expect(dispatchFn({ ps: 'x', plen: 4, pch: '0' }).padL_r).toBe('000x'));
		it('padRight(x, 4, 0) = x000', () => expect(dispatchFn({ ps: 'x', plen: 4, pch: '0' }).padR_r).toBe('x000'));
	});

	describe('substr', () => {
		it('substr(hello, 1, 3) = el', () => expect(dispatchFn({ ss: 'hello', sstart: 1, send: 3 }).substr_r).toBe('el'));
	});

	describe('len (string)', () => {
		it('len(hello) = 5', () => expect(dispatchFn({ lstr: 'hello' }).lenStr_r).toBe(5));
		it('len("") = 0', () => expect(dispatchFn({ lstr: '' }).lenStr_r).toBe(0));
	});

	// -------------------------------------------------------
	// Trigonometry / logarithms
	// -------------------------------------------------------
	describe('sin / cos', () => {
		it('sin(0) = 0', () => expect(dispatchFn({ angle: 0 }).sin_r).toBe(0));
		it('cos(0) = 1', () => expect(dispatchFn({ angle: 0 }).cos_r).toBe(1));
	});

	describe('ln / lg', () => {
		it('ln(1) = 0', () => expect(dispatchFn({ logn: 1 }).ln_r).toBe(0));
		it('lg(10) = 1', () => expect(dispatchFn({ logn: 10 }).lg_r).toBeCloseTo(1));
	});

	// -------------------------------------------------------
	// Null-safe functions (NullSafe state)
	// -------------------------------------------------------
	describe('null-safe functions via NullSafe state', () => {
		it('isNull(null) = true', () => expect(dispatchNull({ v: null }).isNull_r).toBe(true));
		it('isNull(0) = false', () => expect(dispatchNull({ v: 0 }).isNull_r).toBe(false));
		it('isNull("") = false', () => expect(dispatchNull({ v: '' }).isNull_r).toBe(false));

		it('has(null, k) = false', () => expect(dispatchNull({ obj: null, hkey: 'k' }).has_r).toBe(false));
		it('has({a:1}, a) = true', () => expect(dispatchNull({ obj: { a: 1 }, hkey: 'a' }).has_r).toBe(true));
		it('has({a:1}, b) = false', () => expect(dispatchNull({ obj: { a: 1 }, hkey: 'b' }).has_r).toBe(false));

		it('and(null, null) = false (null is falsy)', () => expect(dispatchNull({ lP: null, lQ: null }).and_null_r).toBe(false));
		it('or(null, true) = true', () => expect(dispatchNull({ lP: null, lQ: true }).or_null_r).toBe(true));
		it('none(null, null) = true', () => expect(dispatchNull({ lP: null, lQ: null }).none_null_r).toBe(true));

		it('if(null, y, n) = n (null is falsy)', () => expect(dispatchNull({ ifCond: null, ifT: 'y', ifF: 'n' }).if_null_r).toBe('n'));

		it('coalesce(null, null, fallback) = fallback', () => expect(dispatchNull({ coal1: null, coal2: null, coal3: 'fallback' }).coalesce_r).toBe('fallback'));
		it('coalesce(null, found, other) = found', () => expect(dispatchNull({ coal1: null, coal2: 'found', coal3: 'other' }).coalesce_r).toBe('found'));

		it('len(null) = 0', () => expect(dispatchNull({ lstr: null }).len_null_r).toBe(0));
	});

	// -------------------------------------------------------
	// CollectionFunctions
	// -------------------------------------------------------
	describe('collection functions', () => {
		function makeColPayload(override: Record<string, unknown> = {}) {
			return {
				cNums: [1, 2, 3],
				// saObj/saPath/saVal: exclusive to setAttr (_.set mutates saObj)
				saObj: { a: 1 },
				saPath: 'a',
				saVal: 99,
				// cObj: shared by omit, pick, keys, values (none mutate)
				cObj: { a: 1 },
				cKey: 'a',
				// mBase/mPatch: exclusive to merge (_.merge mutates mBase)
				mBase: { a: 1 },
				mPatch: { b: 2 },
				cItems: [{ n: 1 }, { n: 2 }, { n: 3 }],
				cProp: 'n',
				cFilterVal: 2,
				// cArr: shared by sort/left/right/indexOf/len (none mutate in-place)
				cArr: [1, 2, 3],
				cN: 2,
				cTarget: 2,
				// revArr: exclusive to reverse (_.reverse mutates in-place)
				revArr: [1, 2, 3],
				eqA: 1,
				eqB: 1,
				...override,
			};
		}

		let cInstance: InstanceType<typeof CollectionFunctions>;

		beforeEach(() => {
			cInstance = new CollectionFunctions();
			cInstance.dispatch({ action: cActions.eval, payload: makeColPayload() });
		});

		function dispatch(override: Record<string, unknown>) {
			const inst = new CollectionFunctions();
			inst.dispatch({ action: cActions.eval, payload: makeColPayload(override) });
			return inst.getContext().context;
		}

		describe('stats', () => {
			it('min([3,1,4,1,5]) = 1', () => expect(dispatch({ cNums: [3, 1, 4, 1, 5] }).min_r).toBe(1));
			it('min([]) = null', () => expect(dispatch({ cNums: [] }).min_r).toBeNull());
			it('med([1,2,3,4,5]) = 3', () => expect(dispatch({ cNums: [1, 2, 3, 4, 5] }).med_r).toBe(3));
			it('med([]) = null', () => expect(dispatch({ cNums: [] }).med_r).toBeNull());
			it('sumsq([1,2,3]) = 14', () => expect(dispatch({ cNums: [1, 2, 3] }).sumsq_r).toBe(14));
			it('sumsq([3,4]) = 25', () => expect(dispatch({ cNums: [3, 4] }).sumsq_r).toBe(25));
		});

		describe('isEqual (deep)', () => {
			it('isEqual({x:1},{x:1}) = true', () => expect(dispatch({ eqA: { x: 1 }, eqB: { x: 1 } }).isEq_r).toBe(true));
			it('isEqual({x:1},{x:2}) = false', () => expect(dispatch({ eqA: { x: 1 }, eqB: { x: 2 } }).isEq_r).toBe(false));
			it('isEqual([1,2],[1,2]) = true', () => expect(dispatch({ eqA: [1, 2], eqB: [1, 2] }).isEq_r).toBe(true));
		});

		describe('setAttr', () => {
			it('setAttr({a:1}, b, 2) = {a:1, b:2}', () => expect(dispatch({ saObj: { a: 1 }, saPath: 'b', saVal: 2 }).setAttr_r).toStrictEqual({ a: 1, b: 2 }));
			it('setAttr({a:1}, a, 99) overwrites', () => expect(dispatch({ saObj: { a: 1 }, saPath: 'a', saVal: 99 }).setAttr_r).toStrictEqual({ a: 99 }));
			it('setAttr(null, k, 1) = null (lodash _.set returns null for null input)', () => expect(dispatch({ saObj: null, saPath: 'k', saVal: 1 }).setAttr_r).toBeNull());
		});

		describe('omit', () => {
			it('omit({a:1, b:2}, b) = {a:1}', () => expect(dispatch({ cObj: { a: 1, b: 2 }, cKey: 'b' }).omit_r).toStrictEqual({ a: 1 }));
			it('omit(null, k) = {}', () => expect(dispatch({ cObj: null, cKey: 'k' }).omit_r).toStrictEqual({}));
		});

		describe('pick', () => {
			it('pick({a:1,b:2,c:3}, a) = {a:1}', () => expect(dispatch({ cObj: { a: 1, b: 2, c: 3 }, cKey: 'a' }).pick_r).toStrictEqual({ a: 1 }));
			it('pick(null, k) = {}', () => expect(dispatch({ cObj: null, cKey: 'k' }).pick_r).toStrictEqual({}));
		});

		describe('merge', () => {
			it('merge({a:1}, {b:2}) = {a:1, b:2}', () => expect(dispatch({ mBase: { a: 1 }, mPatch: { b: 2 } }).merge_r).toStrictEqual({ a: 1, b: 2 }));
			it('merge({a:1,b:1}, {b:2}) patch wins', () => expect(dispatch({ mBase: { a: 1, b: 1 }, mPatch: { b: 2 } }).merge_r).toStrictEqual({ a: 1, b: 2 }));
		});

		describe('pluck', () => {
			it('pluck([{n:1},{n:2}], n) = [1,2]', () => expect(dispatch({ cItems: [{ n: 1 }, { n: 2 }], cProp: 'n' }).pluck_r).toStrictEqual([1, 2]));
			it('pluck(null, n) = [] (not a collection)', () => expect(dispatch({ cItems: null, cProp: 'n' }).pluck_r).toStrictEqual([]));
			it('pluck([], n) = []', () => expect(dispatch({ cItems: [], cProp: 'n' }).pluck_r).toStrictEqual([]));
		});

		describe('filterBy', () => {
			it('filterBy([{n:1},{n:2},{n:1}], n, 1) = [{n:1},{n:1}]', () => expect(dispatch({ cItems: [{ n: 1 }, { n: 2 }, { n: 1 }], cProp: 'n', cFilterVal: 1 }).filterBy_r).toStrictEqual([{ n: 1 }, { n: 1 }]));
			it('filterBy(items, n, 99) = [] (no match)', () => expect(dispatch({ cItems: [{ n: 1 }, { n: 2 }], cProp: 'n', cFilterVal: 99 }).filterBy_r).toStrictEqual([]));
			it('filterBy(null, n, 1) = []', () => expect(dispatch({ cItems: null, cProp: 'n', cFilterVal: 1 }).filterBy_r).toStrictEqual([]));
		});

		describe('find', () => {
			it('find([{n:1},{n:2}], n, 2) = {n:2}', () => expect(dispatch({ cItems: [{ n: 1 }, { n: 2 }], cProp: 'n', cFilterVal: 2 }).find_r).toStrictEqual({ n: 2 }));
			it('find(items, n, 99) = null (no match)', () => expect(dispatch({ cItems: [{ n: 1 }, { n: 2 }], cProp: 'n', cFilterVal: 99 }).find_r).toBeNull());
			it('find(null, n, 1) = null', () => expect(dispatch({ cItems: null, cProp: 'n', cFilterVal: 1 }).find_r).toBeNull());
		});

		describe('sample', () => {
			it('sample([1,2,3,4,5], 2) returns 2 items from source', () => {
				const source = [1, 2, 3, 4, 5];
				const result = dispatch({ cArr: source, cN: 2 }).sample_r as number[];
				expect(result).toHaveLength(2);
				for (const item of result) expect(source).toContain(item);
			});
			it('sample([], 2) = []', () => expect(dispatch({ cArr: [], cN: 2 }).sample_r).toStrictEqual([]));
		});

		describe('sort', () => {
			it('sort([3,1,4,1,5]) = [1,1,3,4,5]', () => expect(dispatch({ cArr: [3, 1, 4, 1, 5] }).sort_r).toStrictEqual([1, 1, 3, 4, 5]));
			it('sort([]) = []', () => expect(dispatch({ cArr: [] }).sort_r).toStrictEqual([]));
			it('sort(null) = []', () => expect(dispatch({ cArr: null }).sort_r).toStrictEqual([]));
		});

		describe('left / right', () => {
			it('left([1,2,3,4,5], 2) = [1,2]', () => expect(dispatch({ cArr: [1, 2, 3, 4, 5], cN: 2 }).left_r).toStrictEqual([1, 2]));
			it('left([], 2) = []', () => expect(dispatch({ cArr: [], cN: 2 }).left_r).toStrictEqual([]));
			it('left(null, 2) = []', () => expect(dispatch({ cArr: null, cN: 2 }).left_r).toStrictEqual([]));
			it('right([1,2,3,4,5], 2) = [4,5]', () => expect(dispatch({ cArr: [1, 2, 3, 4, 5], cN: 2 }).right_r).toStrictEqual([4, 5]));
		});

		describe('indexOf', () => {
			it('indexOf([10,20,30], 20) = 1', () => expect(dispatch({ cArr: [10, 20, 30], cTarget: 20 }).indexOf_r).toBe(1));
			it('indexOf([10,20,30], 99) = -1 (not found)', () => expect(dispatch({ cArr: [10, 20, 30], cTarget: 99 }).indexOf_r).toBe(-1));
			it('indexOf(null, 20) = -1', () => expect(dispatch({ cArr: null, cTarget: 20 }).indexOf_r).toBe(-1));
		});

		describe('len (array)', () => {
			it('len([1,2,3,4,5]) = 5', () => expect(dispatch({ cArr: [1, 2, 3, 4, 5] }).lenArr_r).toBe(5));
			it('len([]) = 0', () => expect(dispatch({ cArr: [] }).lenArr_r).toBe(0));
			it('len(null) = 0', () => expect(dispatch({ cArr: null }).lenArr_r).toBe(0));
		});

		describe('reverse', () => {
			it('reverse([1,2,3]) = [3,2,1]', () => expect(dispatch({ revArr: [1, 2, 3] }).reverse_r).toStrictEqual([3, 2, 1]));
			it('reverse([]) = []', () => expect(dispatch({ revArr: [] }).reverse_r).toStrictEqual([]));
		});

		describe('keys / values', () => {
			it('keys({a:1,b:2}) = [a,b]', () => expect(dispatch({ cObj: { a: 1, b: 2 } }).keys_r).toStrictEqual(['a', 'b']));
			it('keys(null) = []', () => expect(dispatch({ cObj: null }).keys_r).toStrictEqual([]));
			it('values({a:1,b:2}) = [1,2]', () => expect(dispatch({ cObj: { a: 1, b: 2 } }).values_r).toStrictEqual([1, 2]));
			it('values(null) = []', () => expect(dispatch({ cObj: null }).values_r).toStrictEqual([]));
		});
	});
});
