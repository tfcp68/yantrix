type TTestIteration = {
	function: () => Promise<void>;
	name: string;
};

type TTemplate = {
	input: string;
	getTestIterations: (module: any) => TTestIteration[];
	description: string;
	automataName: string;
};

export type {
	TTemplate,
	TTestIteration,
};
