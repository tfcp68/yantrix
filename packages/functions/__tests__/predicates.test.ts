import { describe, expect, it } from 'vitest';
import { builtInFunctions } from '../src';

describe('`has` predicate', () => {
	const { has } = builtInFunctions;
	it('should return true if property exists in object', () => {
		expect(has({ a: 1, b: 2 }, 'a')).toBe(true);
		expect(has({ a: 1, b: 2 }, 'b')).toBe(true);
		expect(has({ a: 1, b: 2 }, 'c')).toBe(false);
	});

	it('should return false if property does not exist in object', () => {
		expect(has({}, 'a')).toBe(false);
	});

	it('should return false for empty array', () => {
		expect(has([], '3')).toBe(false);
	});

	it('should return false if object is null or undefined', () => {
		// @ts-expect-error empty first argument
		expect(has.apply(null)).toBe(false);
		// @ts-expect-error empty first argument
		expect(has(undefined, 'a')).toBe(false);
	});

	it('should throw with only 1 argument', () => {
		// @ts-expect-error empty second argument
		expect(() => has({ x: 1 })).toThrow();
		expect(() => has(['a'], null)).toThrow();
	});

	it('should return true if property exists in array', () => {
		expect(has(['x', 'y', 'z'], 0)).toBe(true);
		expect(has(['x', 'y', 'z'], 1)).toBe(true);
		expect(has(['x', 'y', 'z'], 2)).toBe(true);
		expect(has(['x', 'y', 'z'], 3)).toBe(false);
	});

	it('should return false if property does not exist in array', () => {
		expect(has([], 0)).toBe(false);
	});

	it('should return false if first argument is not a key-based object', () => {
		// @ts-expect-error invalid type in first argument
		expect(has('string', 'a')).toBe(false);
		expect(has(1 as any, 'a')).toBe(false);
		expect(has(() => 'whatever', 'a')).toBe(false);
	});
});

describe('`contains` predicate', () => {
	const { contains } = builtInFunctions;
	it('should return true if va;ie exists in object', () => {
		expect(contains({ a: 1, b: 2 }, 1)).toBe(true);
		expect(contains({ a: 1, b: 2 }, 2)).toBe(true);
		expect(contains({ a: 1, b: 2 }, 3)).toBe(false);
	});

	it('should return true if value exists in array', () => {
		expect(contains(['x', 'y', 'z'], 'x')).toBe(true);
		expect(contains(['x', 'y', 'z'], 'y')).toBe(true);
		expect(contains(['x', 'y', 'z'], 'z')).toBe(true);
		expect(contains(['x', 'y', 'z'], 'a')).toBe(false);
	});

	it('should return true if substring exists in string', () => {
		expect(contains('hello world', 'hello')).toBe(true);
		expect(contains('hello world', 'world')).toBe(true);
		expect(contains('hello world', 'foo')).toBe(false);
	});

	it('should return false if property does not exist in object', () => {
		expect(contains({}, 'a')).toBe(false);
	});

	it('should return false for empty array', () => {
		expect(contains([], 'a')).toBe(false);
	});

	it('should return false if object is null or undefined', () => {
		// @ts-expect-error empty first argument
		expect(contains.apply(null)).toBe(false);
		// @ts-expect-error empty first argument
		expect(contains(undefined, 'a')).toBe(false);
	});

	it('should throw invalid 2nd argument if first one is string', () => {
		// @ts-expect-error empty second argument
		expect(() => contains('string')).toThrow();
		expect(() => contains('string', 3)).toThrow();
	});
	it('returns false with only 1 argument if array or object', () => {
		// @ts-expect-error empty second argument
		expect(contains([1, 2])).toBe(false);
		// @ts-expect-error empty second argument
		expect(contains([])).toBe(false);
		// @ts-expect-error empty second argument
		expect(contains({})).toBe(false);
		// @ts-expect-error empty second argument
		expect(contains({ a: 1, b: 2 })).toBe(false);
	});
	it('should return true if false value exists in object', () => {
		expect(contains({ a: false, b: true }, false)).toBe(true);
		expect(contains({ a: 'value', b: false }, false)).toBe(true);
		expect(contains({ a: 0, b: null }, false)).toBe(false);
	});
	it('should return true if null value exists in object', () => {
		expect(contains({ a: null, b: 1 }, null)).toBe(true);
		expect(contains({ a: 'value', b: null }, null)).toBe(true);
		expect(contains({ a: 0, b: false }, null)).toBe(false);
	});
	it('should return true if false value exists in array', () => {
		expect(contains([true, false], false)).toBe(true);
		expect(contains([1, 2, false], false)).toBe(true);
		expect(contains([0, null], false)).toBe(false);
	});
	it('should return true if null value exists in array', () => {
		expect(contains([1, null], null)).toBe(true);
		expect(contains([1, 2, null], null)).toBe(true);
		expect(contains([0, false], null)).toBe(false);
	});
});

describe('`and` predicate', () => {
	const { and } = builtInFunctions;
	it('should return true if all conditions are true', () => {
		expect(and(true, true, true)).toBe(true);
		expect(and(true, true, false)).toBe(false);
		expect(and(true, false, true)).toBe(false);
		expect(and(false, true, true)).toBe(false);
		expect(and(true, false, false)).toBe(false);
		expect(and(false, true, false)).toBe(false);
		expect(and(false, false, true)).toBe(false);
		expect(and(false, false, false)).toBe(false);
	});

	it('should return false if any condition is false', () => {
		expect(and(true, true, false)).toBe(false);
		expect(and(true, false, true)).toBe(false);
		expect(and(false, true, true)).toBe(false);
		expect(and(true, false, false)).toBe(false);
		expect(and(false, true, false)).toBe(false);
		expect(and(false, false, true)).toBe(false);
		expect(and(false, false, false)).toBe(false);
	});

	it('should handle truthy and falsy values correctly', () => {
		expect(and(1, 'non-empty string', true)).toBe(true);
		expect(and(1, '', true)).toBe(false);
		expect(and(0, false, null)).toBe(false);
		expect(and(1, undefined, true)).toBe(false);
		expect(and(1, [], {})).toBe(true);
	});

	it('should return true without arguments', () => {
		expect(and()).toBe(true);
	});
});

describe('`or` predicate', () => {
	const { or } = builtInFunctions;
	it('should return true if any condition is true', () => {
		expect(or(true, true, true)).toBe(true);
		expect(or(true, true, false)).toBe(true);
		expect(or(true, false, true)).toBe(true);
		expect(or(false, true, true)).toBe(true);
		expect(or(true, false, false)).toBe(true);
		expect(or(false, true, false)).toBe(true);
		expect(or(false, false, true)).toBe(true);
		expect(or(false, false, false)).toBe(false);
	});

	it('should return false if all conditions are false', () => {
		expect(or(false, false, false)).toBe(false);
	});

	it('should return false if all conditions are falsy', () => {
		expect(or(0, null, undefined)).toBe(false);
		expect(or(0, null, false)).toBe(false);
		expect(or(0, undefined, false)).toBe(false);
		expect(or(null, undefined, false)).toBe(false);
		expect(or(0, null, Number.NaN)).toBe(false);
		expect(or(0, undefined, Number.NaN)).toBe(false);
		expect(or(null, undefined, Number.NaN)).toBe(false);
		expect(or(0, null, '')).toBe(false);
		expect(or(0, undefined, '')).toBe(false);
		expect(or(null, undefined, '')).toBe(false);
	});
	it('should return true if any condition is truthy', () => {
		expect(or('string', false, false)).toBe(true);
		expect(or(false, [], false)).toBe(true);
		expect(or(false, false, {})).toBe(true);
		expect(or(false, 'string', [])).toBe(true);
		expect(or(null, undefined, {})).toBe(true);
		expect(or(0, '', { key: 'value' })).toBe(true);
	});

	it('should return false when called without arguments', () => {
		expect(or()).toBe(false);
	});
});

describe('`none` predicate', () => {
	const { none } = builtInFunctions;
	it('should return true if none of conditions are true', () => {
		expect(none(false, false, false)).toBe(true);
		expect(none(true, false, false)).toBe(false);
		expect(none(false, true, false)).toBe(false);
		expect(none(false, false, true)).toBe(false);
		expect(none(true, true, false)).toBe(false);
		expect(none(true, false, true)).toBe(false);
		expect(none(false, true, true)).toBe(false);
		expect(none(true, true, true)).toBe(false);
	});

	it('should return false if any condition is true', () => {
		expect(none(true, false, false)).toBe(false);
		expect(none(false, true, false)).toBe(false);
		expect(none(false, false, true)).toBe(false);
		expect(none(true, true, false)).toBe(false);
		expect(none(true, false, true)).toBe(false);
		expect(none(false, true, true)).toBe(false);
		expect(none(true, true, true)).toBe(false);
	});

	it('should handle other falsy values as false', () => {
		expect(none(0, '', null, undefined)).toBe(true);
		expect(none(0, '', null, undefined, true)).toBe(false);
		expect(none(0, '', null, undefined, false)).toBe(true);
		expect(none(0, '', null, undefined, Number.NaN), 'NaN').toBe(true);
		expect(none(0, '', null, undefined, Infinity), 'Infinity').toBe(false);
	});

	it('should return false if any condition is a truthy value', () => {
		expect(none('string')).toBe(false);
		expect(none([1, 2, 3])).toBe(false);
		expect(none({ a: 1, b: 2 })).toBe(false);
		expect(none('string', [1, 2, 3], { a: 1, b: 2 })).toBe(false);
	});

	it('should return true with no arguments', () => {
		expect(none()).toBe(true);
	});
});

describe('`not` predicate', () => {
	const { not } = builtInFunctions;
	it('should return true if the condition is false', () => {
		expect(not(false)).toBe(true);
	});

	it('should return false if the condition is true', () => {
		expect(not(true)).toBe(false);
	});

	it('should throw if no arguments are passed or null is passed', () => {
		// @ts-expect-error no arguments
		expect(() => not()).toThrow();
		expect(() => not(null)).toThrow();
	});
});
