import { parse } from 'path';
import { assert, describe, expect, test } from 'vitest';
import { YantrixParser } from '../yantrixParser.js';
import {
  baseContext,
  baseContextWithPrevious,
  baseEmitEvent,
  baseEmpty,
  baseSubscribe,
} from './fixtures/baseDeclarations.js';
import { primitiveWithValue } from './fixtures/expressions.js';

const invalidCases = [
  ['#[LeftSideProperty]'],
  ['#{LeftSideProperty} <='],
  ['#{LeftSideProperty} =>'],
  ['#{LeftSideProperty} ='],
  ['#{LeftSideProperty'],
  ['#{123LeftSideProperty'],
  ['#{123}'],
  ['#{!!LeftSideProperty}'],
  ['#{LeftSideProperty!@#}'],
  ['#{Left Side Property}'],
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
  ['#{LeftSideProperty} <= (Right Side Property)'],
  ['#{Left1,Left2} <= (Right1, Right2, Right3)'],
  ['#{Left1,Left2} <= (Right1, Right2, Right3=5)'],
  ['#{Left1=1,Left2} <= (Right1, Right2, Right3)'],
  ['#{Left1,Left2} => (Right1, Right2)'],
];

const base = [
  ['', baseEmpty],
  ['#{LeftSideProperty} <= (RightSideProperty)', baseContext],
  ['#{LeftSideProperty} <= {RightSideProperty}', baseContextWithPrevious],
  ['subscribe/event => action', baseSubscribe],
  ['emit/eventName <= (keylist)', baseEmitEvent],
] as const;

const reservedWords = ['+INITIAL', 'note', 'left', 'right', 'end'];

describe('Base grammar declarations', () => {
  describe('Correct input', () => {
    test.each(base)('%s', (input: any, res: any) => {
      const parser = new YantrixParser().parse(input as string);

      assert.deepOwnInclude(parser, res);
    });
  });
  describe('Identical output with ', () => {
    test('#{Left1, Left2} <= (Right1, Right2) = #{Left2, Left1} <= (Right2, Right1)', () => {
      const parser = new YantrixParser();
      const parsedLeft = parser.parse('#{Left1, Left2} <= (Right1, Right2)');
      const parsedRight = parser.parse('#{Left2, Left1} <= (Right2, Right1)');
      const contextLeftDescription = parsedLeft.contextDescription[0];
      const contextRightDescription = parsedRight.contextDescription[0];

      const { context: contextLeft, payload: payloadLeft } =
        contextLeftDescription;
      const { context: contextRight, payload: payloadRight } =
        contextRightDescription;

      expect(contextLeft[0]).toStrictEqual(contextRight[1]);
      expect(contextLeft[1]).toStrictEqual(contextRight[0]);

      expect(payloadLeft[0]).toStrictEqual(payloadRight[1]);
      expect(payloadLeft[1]).toStrictEqual(payloadRight[0]);
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

      const { context: contextLeft, payload: payloadLeft } =
        contextLeftDescription;
      const { context: contextRight, payload: payloadRight } =
        contextRightDescription;

      expect(contextLeft[0]).toStrictEqual(contextRight[1]);
      expect(contextLeft[1]).toStrictEqual(contextRight[0]);
      expect(contextLeft[2]).toStrictEqual(contextRight[2]);

      expect(payloadLeft[0]).toStrictEqual(payloadRight[1]);
      expect(payloadLeft[1]).toStrictEqual(payloadRight[0]);
      expect(payloadLeft[2]).toStrictEqual(payloadRight[2]);
    });
    test('#{Left1, Left2, Left3} = #{     Left1,	Left2      ,   Left3  }', () => {
      const parser = new YantrixParser();
      const parsedLeft = parser.parse('#{Left1, Left2, Left3}');
      const parsedRight = parser.parse('#{     Left1,	Left2      ,   Left3   }');
      const contextLeftDescription = parsedLeft.contextDescription[0];
      const contextRightDescription = parsedRight.contextDescription[0];

      const { context: contextLeft, payload: payloadLeft } =
        contextLeftDescription;
      const { context: contextRight, payload: payloadRight } =
        contextRightDescription;

      contextLeft.forEach((el: any, index: any) => {
        expect(el).toMatchObject(contextRight[index]);
      });
    });
  });
  describe('Incorrect input', () => {
    test.each(invalidCases)(' %s  ----- Error', (input) => {
      expect(() => new YantrixParser().parse(input)).toThrowError();
    });
  });

  describe('Context statement has correct format', () => {
    const parser = new YantrixParser();
    const propertyName = 'LeftHandProperty';
    const correctStatement = `#{${propertyName}}`;
    const incorrectStatements = [
      ...'!@$%^&*()-=+/№+.,\\|'
        .split('')
        .map((char) => `${char}{${propertyName}}`),
      `#[${propertyName}]`,
      `#(${propertyName})`,
      ...reservedWords.map((word) => `#{${word}}`),
    ];
    test.each(incorrectStatements)('%s -- ERROR', (input) => {
      expect(() => parser.parse(input)).toThrowError();
    });
    test(`${correctStatement} --- CORRECT`, () => {
      const result = parser.parse(correctStatement);
      assert.isOk(result);
    });
  });

  describe('Payload cannot have more arguments than the context', () => {
    const parser = new YantrixParser();
    for (let i = 0; i < 100; i++) {
      const contextArgumentCount = Math.ceil(Math.random() * 50);
      const payloadArgumentCount = Math.ceil(Math.random() * 100);
      const contextArguments = Array.apply(null, Array(contextArgumentCount))
        .map((v, i) => `prop${i}`)
        .join(',');
      const payloadArguments = Array.apply(null, Array(payloadArgumentCount))
        .map((v, i) => `prop${i}`)
        .join(',');
      const stringToParse = `#{${contextArguments}} <= (${payloadArguments})`;

      test(`context args: ${contextArgumentCount}, payload args: ${payloadArgumentCount}`, () => {
        if (contextArgumentCount >= payloadArgumentCount) {
          assert.isOk(parser.parse(stringToParse));
        } else {
          expect(() => parser.parse(stringToParse)).toThrowError();
        }
      });
    }
  });

  describe('Previous context cannot have more arguments than the current one', () => {
    const parser = new YantrixParser();
    for (let i = 0; i < 100; i++) {
      const contextArgumentCount = Math.ceil(Math.random() * 50);
      const prevContextArgumentCount = Math.ceil(Math.random() * 100);
      const contextArguments = Array.apply(null, Array(contextArgumentCount))
        .map((v, i) => `prop${i}`)
        .join(',');
      const prevContextArguments = Array.apply(
        null,
        Array(prevContextArgumentCount),
      )
        .map((v, i) => `prop${i}`)
        .join(',');
      const stringToParse = `#{${contextArguments}} <= {${prevContextArguments}}`;

      test(`context args: ${contextArgumentCount}, prev.context args: ${prevContextArgumentCount}`, () => {
        if (contextArgumentCount >= prevContextArgumentCount) {
          assert.isOk(parser.parse(stringToParse));
        } else {
          expect(() => parser.parse(stringToParse)).toThrowError();
        }
      });
    }
  });

  describe('Expressions are created with the correct format', () => {
    const parser = new YantrixParser();
    const correctString = '#{arg=value}';
    const incorrectStrings = [
      '#{arg-value}',
      '#{arg value}',
      '#{arg==value}',
      '#{arg->value}',
      '#{arg<-value}',
      '#{arg={value}}',
    ];
    test(`${correctString} --- CORRECT`, () => {
      const result = parser.parse(correctString);
      assert.isOk(
        result.contextDescription[0].context[0].KeyItemDeclaration.Expression,
      );
    });
    test.each(incorrectStrings)(`%s --- ERROR`, (input) => {
      expect(() => parser.parse(input)).toThrowError();
    });
  });

  describe('Expression values are separated into strings, integers, decimals, functions etc', () => {
    const parser = new YantrixParser();
    test('Expression value is recognized as String', () => {
      const correctString = '#{arg="test"}';
      const result = parser.parse(correctString);
      assert.deepNestedInclude(
        result.contextDescription[0].context[0].KeyItemDeclaration.Expression,
        primitiveWithValue.string('test'),
      );

      const extraStrings = [
        '#{arg="1"}',
        '#{arg="1.01"}',
        '#{arg="func()"}',
        '#{arg="[]"}',
      ];
      extraStrings.forEach((str) =>
        assert.deepNestedInclude(
          result.contextDescription[0].context[0].KeyItemDeclaration.Expression,
          primitiveWithValue.string('test'),
        ),
      );
    });
    test('Expression value is recognized as Integer', () => {
      const correctString = '#{arg=1}';
      const result = parser.parse(correctString);
      assert.deepNestedInclude(
        result.contextDescription[0].context[0].KeyItemDeclaration.Expression,
        primitiveWithValue.integer(1),
      );
    });
    test.skip('Expression value is recognized as Decimal', () => {
      const correctString = '#{val=1.01}';
      const result = parser.parse(correctString);
      assert.deepNestedInclude(
        result.contextDescription[0].context[0].KeyItemDeclaration.Expression,
        primitiveWithValue.decimal(1.01),
      );
    });
    test.skip('Expression value is recognized as Constant', () => {
      const correctString = '#{arg=$(val)}';
      const result = parser.parse(correctString);
      assert.deepNestedInclude(
        result.contextDescription[0].context[0].KeyItemDeclaration.Expression,
        primitiveWithValue.integer(1),
      );
    });
    test('Expression value is recognized as Array', () => {
      const correctString = '#{arg=[]}';
      const result = parser.parse(correctString);
      assert.deepNestedInclude(
        result.contextDescription[0].context[0].KeyItemDeclaration.Expression,
        primitiveWithValue.array(),
      );
    });
    test('Expression value is recognized as Function', () => {
      const correctString = '#{arg=func()}';
      const result = parser.parse(correctString);
      assert.deepNestedInclude(
        result.contextDescription[0].context[0].KeyItemDeclaration.Expression,
        primitiveWithValue.function('func'),
      );
    });
    test('Expression value is recognized as Property', () => {
      const correctString = '#{arg=prop}';
      const result = parser.parse(correctString);
      assert.deepNestedInclude(
        result.contextDescription[0].context[0].KeyItemDeclaration.Expression,
        primitiveWithValue.property('prop'),
      );
    });
  });

  describe('Array expression is created only with an empty array', () => {
    const parser = new YantrixParser();
    test('Empty array expression can be created', () => {
      const correctString = '#{arg=[]}';
      const result = parser.parse(correctString);
      assert.deepNestedInclude(
        result.contextDescription[0].context[0].KeyItemDeclaration.Expression,
        primitiveWithValue.array(),
      );
    });
    test('Non-empty array expression cannot be created', () => {
      const incorrectStrings = [
        '#{arg=[1,2,3]}',
        '#{arg=[1.01,2.02,2.03]}',
        '#{arg=["str1", "str2", "str3"]}',
        '#{arg=[func1(), func2()]}',
        '#{arg=[prop1, prop2]}',
        '#{arg=["mixed array", 1, 1.01, func1(), prop1]}',
      ];
      incorrectStrings.forEach((str) =>
        expect(() => parser.parse(str)).toThrowError(),
      );
    });
  });

  describe('State transformer statement has correct format', () => {
    const parser = new YantrixParser();
    const correctStrings = ['#{arg} <= (val)', '#{arg} <= {val}'];
    const incorrectStrings = [
      '#{arg} <= [val]',
      '#{arg} <= ((val))',
      '#{arg} <= {{val}}',
      '#{{arg}} <= (val)',
      '#{arg} <== (val)',
      '#{arg} <<= (val)',
      '#{arg} <<== (val)',
      '#{arg} <- (val)',
      '#{arg} =< (val)',
      '#{arg} => (val)',
    ];
    test.each(correctStrings)('%s --- CORRECT', (input) =>
      assert.isOk(parser.parse(input)),
    );
    test.each(incorrectStrings)('%s --- ERROR', (input) =>
      expect(() => parser.parse(input)).toThrowError(),
    );
  });

  describe('Subscribe statements have correct format', () => {
    const parser = new YantrixParser();
    const eventName = 'click';
    const actionName = 'OPEN';
    const keyList = ['idx1', 'idx2'];
    const correctStrings = [
      `subscribe/${eventName} => ${actionName}`,
      `subscribe/${eventName} => ${actionName} (${keyList.join(',')})`,
    ];
    const correctString = `subscribe/${eventName} => ${actionName}`;
    const incorrectStrings = [
      `subscribe/${eventName}`,
      `subscrib/${eventName} => ${actionName}`,
      `subscrb/${eventName} => ${actionName}`,
      `subscribe\\${eventName} => ${actionName}`,
      `subscribe//${eventName} => ${actionName}`,
      `subscribe/ => ${actionName}`,
      `subscribe/ =>`,
      `subscribe/${eventName} =>`,
      `subscribe/${eventName} => ()`,
      `subscribe/${eventName} => {}`,
      `subscribe/${eventName} <= ${actionName}`,
      `subscribe/${eventName} => ${actionName} [${keyList.join(',')}]`,
      `subscribe/${eventName} => ${actionName} {${keyList.join(',')}}`,
      `subscribe/${eventName} => ${actionName} ()`,
    ];
    test(`${correctString} --- CORRECT`, () => {
      assert.isOk(parser.parse(correctString));
    });
    test.each(incorrectStrings)(`%s --- ERROR`, (str) =>
      expect(() => parser.parse(str)).toThrowError(),
    );
  });

  describe('Emit statements have correct format', () => {
    const parser = new YantrixParser();
    const eventName = 'selected';
    const keyList = ['idx1', 'idx2'];
    const correctStrings = [
      `emit/${eventName} <= (${keyList.join(',')})`,
      `emit/${eventName}`,
    ];
    const incorrectStrings = [
      `emt/${eventName}`,
      `emit/${eventName} <= ${keyList.join(',')}`,
      `emit/${eventName} <= ()`,
      `emit/${eventName} <=`,
      `emit/${eventName} =>`,
      `emit/${eventName} <= {${keyList.join(',')}}`,
      `emit/${eventName} <= [${keyList.join(',')}]`,
      `emit/${eventName} => (${keyList.join(',')})`,
    ];
    test.each(correctStrings)('%s --- CORRECT', (str) =>
      assert.isOk(parser.parse(str)),
    );
    test.each(incorrectStrings)(`%s --- ERROR`, (str) =>
      expect(() => parser.parse(str)).toThrowError(),
    );
  });

  describe.skip('Effect statements have correct format', () => {
    const parser = new YantrixParser();
    const eventName = 'selected';
    const keyList = ['idx1', 'idx2'];
    const correctStrings = [
      `effect/${eventName} <= (${keyList.join(',')})`,
      `effect/${eventName}`,
    ];
    const incorrectStrings = [
      `efect/${eventName}`,
      `effect/${eventName} <= ${keyList.join(',')}`,
      `effect/${eventName} <= ()`,
      `effect/${eventName} <=`,
      `effect/${eventName} =>`,
      `effect/${eventName} <= {${keyList.join(',')}}`,
      `effect/${eventName} <= [${keyList.join(',')}]`,
      `effect/${eventName} => (${keyList.join(',')})`,
    ];
    test.each(correctStrings)('%s --- CORRECT', (str) =>
      assert.isOk(parser.parse(str)),
    );
    test.each(incorrectStrings)(`%s --- ERROR`, (str) =>
      expect(() => parser.parse(str)).toThrowError(),
    );
  });
});
