import {
  expressions,
  functions,
  getExpression,
  TExpressionTypes,
} from './expressions.js';

const baseKeyItemDeclaration = {
  TargetProperty: 'property',
};

const getKeyItem = (expression: TExpressionTypes | null) => {
  return {
    contextDescription: [
      {
        context: [
          {
            KeyItemDeclaration: {
              ...expression,
              ...baseKeyItemDeclaration,
            },
          },
        ],
      },
    ],
  };
};

/// Base key item declaration
const declarationKeyItem = getKeyItem(null);
export const withStringInitial = getKeyItem(expressions.string);
export const withArrayInitial = getKeyItem(expressions.array);
export const withIntegerInitial = getKeyItem(expressions.integer);
export const withPropertyInitial = getKeyItem(expressions.property);

/// Base function declaration
const expression = getKeyItem(expressions.function);
const withString = getKeyItem(getExpression(functions.withStringArgs));
const withProperty = getKeyItem(getExpression(functions.withPropertyArgs));
const withInteger = getKeyItem(getExpression(functions.withIntegerArgs));
const withDecimal = getKeyItem(getExpression(functions.withDecimalArgs));
const withShaffledArgs = getKeyItem(getExpression(functions.withShaffledArgs));
const recursive = getKeyItem(getExpression(functions.withRecursiveFunction));
const multiplyProperty = getKeyItem(getExpression(functions.withMultiplyArgs));

export const functionsFixtures = {
  expression,
  recursive,
  withInteger,
  withProperty,
  withString,
  withDecimal,
  multiplyProperty,
  withShaffledArgs,
};
export const keyItem = {
  declarationKeyItem,
  withStringInitial,
  withArrayInitial,
  withIntegerInitial,
  withPropertyInitial,
};
