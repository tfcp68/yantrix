import {
	defineExpressionIsFunction,
	DefineFunction,
	getDefineStatements,
	getInjectStatements,
} from '@yantrix/yantrix-parser';
import { TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';
import { TDependencyGraph, TImports } from './types';

export function buildDependencyGraph(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	imports: TImports;
	dependencyGraph: TDependencyGraph;
}) {
	const defines = props.diagram.states.flatMap(state => state.notes ? getDefineStatements(state.notes) : []);
	const injects = props.diagram.states.flatMap(state => state.notes ? getInjectStatements(state.notes) : []);

	const addDependencies = (expression: DefineFunction, currentFunc: string) => {
		const { name: FunctionName, args: Arguments } = expression;

		if (!props.dependencyGraph.has(currentFunc)) {
			props.dependencyGraph.set(currentFunc, new Set());
		}

		props.dependencyGraph.get(currentFunc)!.add(FunctionName);

		for (const arg of Arguments) {
			const argType = '$type' in arg ? arg.$type as string : '';
			if (argType === 'DefineFunction' || argType === 'NestedDefineFunction') {
				addDependencies(arg as unknown as DefineFunction, currentFunc);
			}
		}
	};

	injects.forEach((inject) => {
		if (!props.dependencyGraph.has(inject.identifier)) {
			props.dependencyGraph.set(inject.identifier, new Set());
		}
	});

	for (const define of defines) {
		if (defineExpressionIsFunction(define.expression)) {
			addDependencies(define.expression, define.identifier);
		} else if (!props.dependencyGraph.has(define.identifier)) {
			// literal return (e.g. define/f () => 3): no deps, still needs registration
			props.dependencyGraph.set(define.identifier, new Set());
		}
	}
	return {
		imports: props.imports,
		dependencyGraph: props.dependencyGraph,
	} as const;
}

export function checkForCyclicDependencies(props: {
	dependencyGraph: TDependencyGraph;
}) {
	const cycles = detectCycles({
		dependencyGraph: props.dependencyGraph,
	});
	if (cycles.length > 0) {
		const cycleStrings = cycles.map(cycle => cycle.join(' -> '));
		throw new Error(`Cyclic dependencies detected in function definitions:\n${cycleStrings.join('\n')}`);
	}
}

export function detectCycles(props: {
	dependencyGraph: TDependencyGraph;
}): string[][] {
	const visited = new Set<string>();
	const recursionStack = new Set<string>();
	const cycles: string[][] = [];

	const dfs = (node: string, path: string[] = []): boolean => {
		if (!visited.has(node)) {
			visited.add(node);
			recursionStack.add(node);

			const neighbors = props.dependencyGraph.get(node) || new Set();
			for (const neighbor of neighbors) {
				if (!visited.has(neighbor)) {
					if (dfs(neighbor, [...path, node])) {
						return true;
					}
				} else if (recursionStack.has(neighbor)) {
					cycles.push([...path, node, neighbor]);
					return true;
				}
			}
		}

		recursionStack.delete(node);
		return false;
	};

	for (const node of props.dependencyGraph.keys()) {
		if (!visited.has(node)) {
			dfs(node);
		}
	}

	return cycles;
}
