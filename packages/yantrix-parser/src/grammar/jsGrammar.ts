export * from '../constants/index';

const recursiveDepth = () => {
	let counterDepth = 1;

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
