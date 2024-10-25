export type TImports = {
	[path: string]: string[];
};
export type TDependencyGraph = Map<string, Set<string>>;
