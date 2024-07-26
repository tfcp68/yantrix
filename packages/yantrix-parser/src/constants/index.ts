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
	'$', // Нужны двойные кавычки, т.к при одинарных некорректно импортируется в грамматику
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
/**
 * This object contains the different types of expressions that can be used in the parser.
 */
export const ExpressionTypes = {
	Function: 'function',
	StringDeclaration: 'string',
	ArrayDeclaration: 'array',
	IntegerDeclaration: 'integer',
	DecimalDeclaration: 'decimal',
	FunctionProperty: 'FunctionProperty',
	Constant: 'constant',
	Payload: 'payload',
	Context: 'context',
} as const;
