export const ReservedList = ['end note, +INITIAL'];

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
	Identifier: 'identifier',
} as const;

export const maxNestedFuncLevel = 8;
