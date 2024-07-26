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
	Constant: 'constant',
	IntegerDeclaration: 'integer',
	DecimalDeclaration: 'decimal',
	FunctionProperty: 'FunctionProperty',
	Property: 'property',
} as const;

const recursiveDepth = () => {
	let counterDepth = 0;

	return (funcObj: any) => {
		const args = funcObj.FunctionDeclaration.Arguments;
		const funcArgs = args.filter((item: any) => item.hasOwnProperty('FunctionDeclaration'));

		if (args.length === 0 || funcArgs.length === 0) {
			return 1;
		} else {
			const arrArgs: number[] = [];
			for (const func of funcArgs) {
				arrArgs.push(calcDepthFunc(func));
			}
			counterDepth = Math.max(...arrArgs) + 1;
			return counterDepth;
		}
	};
};

export const calcDepthFunc = recursiveDepth();
