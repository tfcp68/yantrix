import { describe, expect, it } from 'vitest';
import { getEffectStatements, YantrixParser } from '../src';

describe('effect statement', () => {
	const parser = new YantrixParser();

	it('parses the documented Effect declaration without Event Meta', () => {
		const document = parser.parse('effect/selected');
		const effects = getEffectStatements(document);

		expect(effects).toHaveLength(1);
		expect(effects[0]).toMatchObject({
			$type: 'EffectStatement',
			identifier: 'selected',
			metaKeys: [],
		});
	});

	it('parses the documented non-empty Event Meta key list', () => {
		const document = parser.parse('effect/selected <= (idx1, idx2)');
		const effects = getEffectStatements(document);

		expect(effects).toHaveLength(1);
		expect(effects[0]!.identifier).toBe('selected');
		expect(effects[0]!.metaKeys).toEqual(['idx1', 'idx2']);
	});

	it('preserves declaration order for multiple Effects', () => {
		const effects = getEffectStatements(parser.parse(`
			effect/selected <= (idx)
			effect/confirmed
		`));

		expect(effects.map(effect => effect.identifier)).toEqual(['selected', 'confirmed']);
	});

	it.each([
		'efect/selected',
		'effect/selected <= idx1, idx2',
		'effect/selected <= ()',
		'effect/selected <=',
		'effect/selected => (idx1, idx2)',
		'effect/selected <= {idx1, idx2}',
		'effect/selected <= [idx1, idx2]',
		'effect/selected <= (idx1, idx1)',
	])('rejects invalid Effect syntax: %s', (input) => {
		expect(() => parser.parse(input)).toThrowError();
	});
});
