/**
 * This constant holds a list of reserved words in the  parser.
 */
export const ReservedList = ['end note, +INITIAL'];

/**
 * This constant holds a list of special characters that are not allowed in yantrix expressions.
 */
export const SpecialCharList = [
	'!',
	'@',
	'$',
	'%',
	'^',
	'&',
	'*',
	'"',
	'№',
	'(',
	')',
	'[',
	']',
	'{',
	'}',
	'+',
	'-',
	'=',
	';',
	':',
	'?',
	'.',
	',',
	'/',
	'\\',
	'|',
];
export const ExpressionTypes = {
	Function: 'function',
	StringDeclaration: 'string',
	ArrayDeclaration: 'array',
	Constant: 'constant',
	IntegerDeclaration: 'integer',
	DecimalDeclaration: 'decimal',
	FunctionProperty: 'FunctionProperty',
	Property: 'property',
} as const;
