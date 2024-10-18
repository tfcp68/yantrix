import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
/*
	Predicates object is necessary for resolving the correct state to transition to, when using forks;
	Function, obtained w/ IDs of currentState and dispatchedAction , is later loaded with values
	from context/payload during root reducer operations.
	Resulting value is the new state of the automata, exact state value depends on which conditions resolve to TRUE inside
*/
import { isFunctionExpression, YantrixParser } from '@yantrix/yantrix-parser';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';
import { expressions } from '../expressions';

const parser = new YantrixParser();

export function createPredicates(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	expressionRecord: TExpressionRecord;
}) {
	const predicates: string[] = [];
	for (const state in props.diagram.actionChains) {
		const originalStateId = props.stateDictionary.getDictionary()[state];
		const statePredicates = [];
		const possibleActions = props.diagram.actionChains[state]!;
		for (const action in possibleActions) {
			const actionId = props.actionDictionary.getDictionary()[action];
			const chains = possibleActions[action]!;
			const processedStateChecks = [];
			for (const { chain, state: transitionState } of chains) {
				const transitionStateId = props.stateDictionary.getDictionary()[transitionState];
				const conditions = [];

				/*
					need to check if parts of the chain can be processed by the parser,
					turned into expressions and used later in the generated predicates.

					if they cant be processed (i.e they are internal ids or unrelated names),
					assume the segment resolves to TRUE and move on
				*/
				for (const segment of chain) {
					try {
						const wrappedSegment = `=${segment}?`;
						const processedExpression = parser.parse(wrappedSegment);
						// check the expression property at the top-level of the parsed object
						if (!processedExpression.expression || !isFunctionExpression(processedExpression.expression)) {
							throw new Error('Incorrect expression');
						}
						const expressionValue = expressions.functions.getExpressionValue({
							expression: processedExpression.expression,
							expressionRecord: props.expressionRecord,
						});
						conditions.push(expressionValue);
					} catch {
						conditions.push(true);
						continue;
					}
				}
				if (conditions.length > 0) {
					const mappedConditions = conditions.map((cond, index) => `const cond${index + 1} = ${cond};`);
					mappedConditions.push(`
							if(${conditions.map((_, index) => `cond${index + 1} === true`).join(' && ')}) {
								return ${transitionStateId};
							}
							else return undefined;
						`);
					processedStateChecks.push(mappedConditions.join('\n'));
				}
			}
			if (processedStateChecks.length > 0) {
				statePredicates.push(
					`${actionId}: (prevContext, payload, functionDictionary) => {
							${
								processedStateChecks.map((st, index) => `
										const st${index + 1} = (function(){
											${st}
										})();
										if(st${index + 1}) return st${index + 1};
								`).join('')
							}
							return null; // in case the predicate can't resolve the transition state
						 }`,
				);
			}
		}
		if (statePredicates.length > 0) {
			predicates.push(
				`${originalStateId}: {
						${statePredicates.join(',\n')}
					}`,
			);
		}
	}
	return predicates.join(',\n');
}
