import { ExpressionTypes, TExpressionDefine } from '@yantrix/yantrix-parser';
import { TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';
import { TDependencyGraph, TImports } from './types';

export function buildDependencyGraph(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	imports: TImports;
	dependencyGraph: TDependencyGraph;
}) {
	const defines = props.diagram.states.flatMap(state => state.notes?.defines ?? []);

	const addDependencies = (expression: TExpressionDefine<'function'>, currentFunc: string) => {
		const { FunctionName, Arguments } = expression.FunctionDeclaration;

		if (!props.imports['@yantrix/core']) {
			props.imports['@yantrix/core'] = [];
		}

		props.imports['@yantrix/core'].push(FunctionName);

		if (!props.dependencyGraph.has(currentFunc)) {
			props.dependencyGraph.set(currentFunc, new Set());
		}

		props.dependencyGraph.get(currentFunc)!.add(FunctionName);

		for (const arg of Arguments) {
			if (arg.expressionType === 'function') {
				addDependencies(arg, currentFunc);
			}
		}
	};

	for (const define of defines) {
		if (define.expression.expressionType === ExpressionTypes.Function) {
			addDependencies(define.expression, define.identifier);
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
