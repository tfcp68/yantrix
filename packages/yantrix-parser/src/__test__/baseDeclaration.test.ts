import { assert, describe, expect, test } from 'vitest';
import { YantrixParser } from '../yantrixParser.js';
import {
	baseContext,
	baseEmitEvent,
	baseEmpty,
	baseSubscribe,
} from './fixtures/baseDeclarations.js';

describe('Base grammer declarations', () => {
	describe('Correct input', () => {
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
			const parser = new YantrixParser().parse(
				'subscribe/event => action',
			);

			assert.deepInclude(parser, baseSubscribe);
		});
		test('should be return dictionary with event emit declaration', () => {
			const parser = new YantrixParser().parse(
				'emit/eventName <= (keylist)',
			);

			assert.deepInclude(parser, baseEmitEvent);
		});
	});
	describe('Identical output with ', () => {
		test('#{Left1, Left2} <= (Right1, Right2) = #{Left2, Left1} <= (Right2, Right1)', () => {
			const parser = new YantrixParser();
			const parsedLeft = parser.parse(
				'#{Left1, Left2} <= (Right1, Right2)',
			);
			const parsedRight = parser.parse(
				'#{Left2, Left1} <= (Right2, Right1)',
			);
			const contextLeftDescription = parsedLeft.contextDescription[0];
			const contextRightDescription = parsedRight.contextDescription[0];

			const { context, payload } = contextLeftDescription;
			const { context: contextRight, payload: payloadRight } =
				contextRightDescription;

			expect(context[0]).toStrictEqual(contextRight[1]);
			expect(context[1]).toStrictEqual(contextRight[0]);

			expect(payload[0]).toStrictEqual(payloadRight[1]);
			expect(payload[1]).toStrictEqual(payloadRight[0]);
		});

		test('#{Left1, Left2, Left3} <= (Right1, Right2) = #{Left2, Left1, Left3} <= (Right2, Right1)', () => {
			const parser = new YantrixParser();
			const parsedLeft = parser.parse(
				'#{Left1, Left2, Left3} <= (Right1, Right2)',
			);
			const parsedRight = parser.parse(
				'#{Left2, Left1, Left3} <= (Right2, Right1)',
			);
			const contextLeftDescription = parsedLeft.contextDescription[0];
			const contextRightDescription = parsedRight.contextDescription[0];

			const { context, payload } = contextLeftDescription;
			const { context: contextRight, payload: payloadRight } =
				contextRightDescription;

			expect(context[0]).toStrictEqual(contextRight[1]);
			expect(context[1]).toStrictEqual(contextRight[0]);
			expect(context[2]).toStrictEqual(contextRight[2]);

			expect(payload[0]).toStrictEqual(payloadRight[1]);
			expect(payload[1]).toStrictEqual(payloadRight[0]);
			expect(payload[2]).toStrictEqual(payloadRight[2]);
		});
		test('#{Left1, Left2, Left3} = #{     Left1,	Left2      ,   Left3  }', () => {
			const parser = new YantrixParser();
			const parsedLeft = parser.parse('#{Left1, Left2, Left3}');
			const parsedRight = parser.parse(
				'#{     Left1,	Left2      ,   Left3   }',
			);
			const contextLeftDescription = parsedLeft.contextDescription[0];
			const contextRightDescription = parsedRight.contextDescription[0];

			const { context } = contextLeftDescription;
			const { context: contextRight } = contextRightDescription;

			context.forEach((el: any, index: any) => {
				expect(el).toMatchObject(contextRight[index]);
			});
		});
	});
	describe('Incorrect input', () => {
		const testCases = [
			['#{LeftSideProperty} <='],
			['#{LeftSideProperty} =>'],
			['#{LeftSideProperty} ='],
			['#{LeftSideProperty'],
			['#{,LeftSideProperty'],
			['#{{LeftSideProperty} =>'],
			['#{LeftSideProperty} =>'],
			['#{}'],
			['#{} => ()'],
			['#{} => (RightSideProperty)'],
			['#(LeftSideProperty) <= {RightSideProperty}'],
			['#{LeftSideProperty = }'],
			['#{LeftSideProperty,}'],
			['#{LeftSideProperty = LeftSideProperty}'],
			['#{LeftSideProperty =} => (RightSideProperty=)'],
			['#{LeftSideProperty} => (RightSideProperty,)'],
			['#{LeftSideProperty} => (RightSideProperty)'],
			['#{Left1,Left2} <= (Right1, Right2, Right3)'],
			['#{Left1,Left2} <= (Right1, Right2, Right3=5)'],
			['#{Left1=1,Left2} <= (Right1, Right2, Right3)'],
			['#{Left1,Left2} => (Right1, Right2)'],
		];
		test.each(testCases)(' %s  ----- Error', (input) => {
			expect(() => new YantrixParser().parse(input)).toThrowError();
		});
	});
});
