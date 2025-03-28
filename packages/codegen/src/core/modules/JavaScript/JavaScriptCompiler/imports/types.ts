export type TImports = {
	[path: string]: string[];
};
export type TProcessImport = { key: string; value: string[] };
// import * as userFunctions from 'userFunctions';

export type TDependencyGraph = Map<string, Set<string>>;
