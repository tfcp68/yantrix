import { builtInFunctions } from '@yantrix/functions';
import { uniqId } from '@yantrix/utils';
import { TTemplate } from './types';
import { generateTemplate, getRandomNumber } from './utils';

const templates: TTemplate[] = [];
// add
templates.push(
	generateTemplate({
		functionName: 'add',
		description: 'add',
		returnedValueExpectedFunction: builtInFunctions.add,
		getPayloads: () => ([getRandomNumber(), getRandomNumber()]),
	}),
	generateTemplate({
		functionName: 'add',
		description: 'add with 5 payloads',
		returnedValueExpectedFunction: builtInFunctions.add,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'add',
		description: 'add TypeError',
		getPayloads: () => [uniqId(), uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// diff
templates.push(
	generateTemplate({
		functionName: 'diff',
		description: 'diff',
		returnedValueExpectedFunction: builtInFunctions.diff,
		getPayloads: () => ([getRandomNumber(), getRandomNumber()]),
	}),
	generateTemplate({
		functionName: 'diff',
		description: 'diff with 5 payloads',
		returnedValueExpectedFunction: builtInFunctions.diff,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'diff',
		description: 'diff TypeError',
		getPayloads: () => [uniqId(), uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// mult
templates.push(
	generateTemplate({
		functionName: 'mult',
		description: 'multiply two numbers',
		returnedValueExpectedFunction: builtInFunctions.mult,
		getPayloads: () => ([getRandomNumber(), getRandomNumber()]),
	}),
	generateTemplate({
		functionName: 'mult',
		description: 'multiply five numbers',
		returnedValueExpectedFunction: builtInFunctions.mult,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'mult',
		description: 'multiply TypeError',
		getPayloads: () => [uniqId(), uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// div
templates.push(
	generateTemplate({
		functionName: 'div',
		description: 'divide two numbers',
		returnedValueExpectedFunction: builtInFunctions.div,
		getPayloads: () => ([getRandomNumber(), getRandomNumber()]),
	}),
	generateTemplate({
		functionName: 'div',
		description: 'divide five numbers',
		returnedValueExpectedFunction: builtInFunctions.div,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
);
// inc
templates.push(
	generateTemplate({
		functionName: 'inc',
		description: 'increment a number',
		returnedValueExpectedFunction: builtInFunctions.inc,
		getPayloads: () => ([getRandomNumber()]),
	}),
	generateTemplate({
		functionName: 'inc',
		description: 'increment with 5 payloads',
		returnedValueExpectedFunction: builtInFunctions.inc,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'inc',
		description: 'increment TypeError',
		getPayloads: () => [uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// dec
templates.push(
	generateTemplate({
		functionName: 'dec',
		description: 'decrement a number',
		returnedValueExpectedFunction: builtInFunctions.dec,
		getPayloads: () => ([getRandomNumber()]),
	}),
	generateTemplate({
		functionName: 'dec',
		description: 'decrement with 5 payloads',
		returnedValueExpectedFunction: builtInFunctions.dec,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'dec',
		description: 'decrement TypeError',
		getPayloads: () => [uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// neg
templates.push(
	generateTemplate({
		functionName: 'neg',
		description: 'negate a number',
		returnedValueExpectedFunction: builtInFunctions.neg,
		getPayloads: () => ([getRandomNumber()]),
	}),
	generateTemplate({
		functionName: 'neg',
		description: 'negate with 5 payloads',
		returnedValueExpectedFunction: builtInFunctions.neg,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'neg',
		description: 'negate TypeError',
		getPayloads: () => [uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// inv
templates.push(
	generateTemplate({
		functionName: 'inv',
		description: 'invert a number',
		returnedValueExpectedFunction: builtInFunctions.inv,
		getPayloads: () => ([getRandomNumber()]),
	}),
	generateTemplate({
		functionName: 'inv',
		description: 'invert with 5 payloads',
		returnedValueExpectedFunction: builtInFunctions.inv,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'inv',
		description: 'invert TypeError',
		getPayloads: () => [uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// mod
templates.push(
	generateTemplate({
		functionName: 'mod',
		description: 'mod a number by another',
		returnedValueExpectedFunction: builtInFunctions.mod,
		getPayloads: () => ([getRandomNumber(), getRandomNumber()]),
	}),
	generateTemplate({
		functionName: 'mod',
		description: 'mod with 5 payloads',
		returnedValueExpectedFunction: builtInFunctions.mod,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'mod',
		description: 'mod TypeError',
		getPayloads: () => [uniqId(), uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// trunc
templates.push(
	generateTemplate({
		functionName: 'trunc',
		description: 'truncate a number',
		returnedValueExpectedFunction: builtInFunctions.trunc,
		getPayloads: () => ([getRandomNumber()]),
	}),
	generateTemplate({
		functionName: 'trunc',
		description: 'truncate with 5 payloads',
		returnedValueExpectedFunction: builtInFunctions.trunc,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'trunc',
		description: 'truncate TypeError',
		getPayloads: () => [uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// ceil
templates.push(
	generateTemplate({
		functionName: 'ceil',
		description: 'round a number up to the nearest integer',
		returnedValueExpectedFunction: builtInFunctions.ceil,
		getPayloads: () => ([getRandomNumber()]),
	}),
	generateTemplate({
		functionName: 'ceil',
		description: 'round with 5 payloads',
		returnedValueExpectedFunction: builtInFunctions.ceil,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'ceil',
		description: 'ceil TypeError',
		getPayloads: () => [uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// round
templates.push(
	generateTemplate({
		functionName: 'round',
		description: 'round a number to the nearest integer',
		returnedValueExpectedFunction: builtInFunctions.round,
		getPayloads: () => ([getRandomNumber()]),
	}),
	generateTemplate({
		functionName: 'round',
		description: 'round with 5 payloads',
		returnedValueExpectedFunction: builtInFunctions.round,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'round',
		description: 'round TypeError',
		getPayloads: () => [uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// sin
templates.push(
	generateTemplate({
		functionName: 'sin',
		description: 'calculate sine of a number',
		returnedValueExpectedFunction: builtInFunctions.sin,
		getPayloads: () => ([getRandomNumber()]),
	}),
	generateTemplate({
		functionName: 'sin',
		description: 'calculate sine with 5 payloads',
		returnedValueExpectedFunction: builtInFunctions.sin,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'sin',
		description: 'sin TypeError',
		getPayloads: () => [uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// cos
templates.push(
	generateTemplate({
		functionName: 'cos',
		description: 'calculate cosine of a number',
		returnedValueExpectedFunction: builtInFunctions.cos,
		getPayloads: () => ([getRandomNumber()]),
	}),
	generateTemplate({
		functionName: 'cos',
		description: 'calculate cosine with 5 payloads',
		returnedValueExpectedFunction: builtInFunctions.cos,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'cos',
		description: 'cos TypeError',
		getPayloads: () => [uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// sqrt
templates.push(
	generateTemplate({
		functionName: 'sqrt',
		description: 'calculate square root of a number',
		returnedValueExpectedFunction: builtInFunctions.sqrt,
		getPayloads: () => ([getRandomNumber()]),
	}),
	generateTemplate({
		functionName: 'sqrt',
		description: 'calculate square root with 5 payloads',
		returnedValueExpectedFunction: builtInFunctions.sqrt,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'sqrt',
		description: 'sqrt TypeError',
		getPayloads: () => [uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// log
templates.push(
	generateTemplate({
		functionName: 'log',
		description: 'calculate natural logarithm of a number',
		returnedValueExpectedFunction: builtInFunctions.log,
		getPayloads: () => ([getRandomNumber(), getRandomNumber()]),
	}),
	generateTemplate({
		functionName: 'log',
		description: 'calculate natural logarithm with 5 payloads',
		returnedValueExpectedFunction: builtInFunctions.log,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'log',
		description: 'log TypeError',
		getPayloads: () => [uniqId(), uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// ln
templates.push(
	generateTemplate({
		functionName: 'ln',
		description: 'calculate natural logarithm of a number',
		returnedValueExpectedFunction: builtInFunctions.ln,
		getPayloads: () => ([getRandomNumber()]),
	}),
	generateTemplate({
		functionName: 'ln',
		description: 'calculate natural logarithm with 5 payloads',
		returnedValueExpectedFunction: builtInFunctions.ln,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'ln',
		description: 'ln TypeError',
		getPayloads: () => [uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// lg
templates.push(
	generateTemplate({
		functionName: 'lg',
		description: 'calculate base-10 logarithm of a number',
		returnedValueExpectedFunction: builtInFunctions.lg,
		getPayloads: () => ([getRandomNumber()]),
	}),
	generateTemplate({
		functionName: 'lg',
		description: 'calculate base-10 logarithm with 5 payloads',
		returnedValueExpectedFunction: builtInFunctions.lg,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'lg',
		description: 'lg TypeError',
		getPayloads: () => [uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// deg
templates.push(
	generateTemplate({
		functionName: 'deg',
		description: 'convert radians to degrees',
		returnedValueExpectedFunction: builtInFunctions.deg,
		getPayloads: () => ([getRandomNumber()]),
	}),
	generateTemplate({
		functionName: 'deg',
		description: 'convert radians with 5 payloads',
		returnedValueExpectedFunction: builtInFunctions.deg,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'deg',
		description: 'deg TypeError',
		getPayloads: () => [uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// rad
templates.push(
	generateTemplate({
		functionName: 'rad',
		description: 'convert degrees to radians',
		returnedValueExpectedFunction: builtInFunctions.rad,
		getPayloads: () => ([getRandomNumber()]),
	}),
	generateTemplate({
		functionName: 'rad',
		description: 'convert degrees with 5 payloads',
		returnedValueExpectedFunction: builtInFunctions.rad,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'rad',
		description: 'rad TypeError',
		getPayloads: () => [uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// max
templates.push(
	generateTemplate({
		functionName: 'max',
		description: 'find maximum value in a list of numbers',
		returnedValueExpectedFunction: builtInFunctions.max,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'max',
		description: 'find max TypeError',
		getPayloads: () => [uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// min
templates.push(
	generateTemplate({
		functionName: 'min',
		description: 'find minimum value in a list of numbers',
		returnedValueExpectedFunction: builtInFunctions.min,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'min',
		description: 'find min TypeError',
		getPayloads: () => [uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// avg
templates.push(
	generateTemplate({
		functionName: 'avg',
		description: 'calculate average of a list of numbers',
		returnedValueExpectedFunction: builtInFunctions.avg,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'avg',
		description: 'find avg TypeError',
		getPayloads: () => [uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// med
templates.push(
	generateTemplate({
		functionName: 'med',
		description: 'calculate median of a list of numbers',
		returnedValueExpectedFunction: builtInFunctions.med,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'med',
		description: 'find med TypeError',
		getPayloads: () => [uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// sum
templates.push(
	generateTemplate({
		functionName: 'sum',
		description: 'calculate the sum of a list of numbers',
		returnedValueExpectedFunction: builtInFunctions.sum,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'sum',
		description: 'find sum TypeError',
		getPayloads: () => [uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// sumsq
templates.push(
	generateTemplate({
		functionName: 'sumsq',
		description: 'calculate the sum of squares of a list of numbers',
		returnedValueExpectedFunction: builtInFunctions.sumsq,
		getPayloads: () => Array.from({ length: 5 }, () => getRandomNumber()),
	}),
	generateTemplate({
		functionName: 'sumsq',
		description: 'find sumsq TypeError',
		getPayloads: () => [uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);
// sumProduct
templates.push(
	generateTemplate({
		functionName: 'sumProduct',
		description: 'find sumProduct TypeError',
		getPayloads: () => [uniqId()],
		iterationsCount: 1,
		expectError: true,
		error: TypeError,
	}),
);

export default templates;
