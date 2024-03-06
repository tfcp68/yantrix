import { assert, describe, test } from 'vitest';
import { YantrixParser } from '../yantrixParser.js';
import {
	baseContext,
	baseEmitEvent,
	baseEmpty,
	baseSubscribe,
} from './fixtures/baseDeclarations.js';

describe('Base grammar declarations', () => {
	test('should be return empty dictionary', () => {
		const parser = new YantrixParser().parse('');

		assert.deepInclude(parser, baseEmpty);
	});
	test('should be return dictionary with context declaration', () => {
		const parser = new YantrixParser().parse(
			'#{LeftSideProperty} <= (RightSideProperty)',
		);

		assert.deepInclude(parser, baseContext);
	});
	test('should be return dictionary with subscribe declaration', () => {
		const parser = new YantrixParser().parse('subscribe/event => action');

		assert.deepInclude(parser, baseSubscribe);
	});
	test('should be return dictionary with event emit declaration', () => {
		const parser = new YantrixParser().parse('emit/eventName <= (keylist)');

		assert.deepInclude(parser, baseEmitEvent);
	});
});
