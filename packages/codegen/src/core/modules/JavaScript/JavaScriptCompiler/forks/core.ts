import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { TActionChain, TActionChainParams } from '@yantrix/mermaid-parser';
import { isFunctionExpression, YantrixParser } from '@yantrix/yantrix-parser';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';
import { expressions } from '../expressions';

const parser = new YantrixParser();

/*
	Predicates object is necessary for resolving the correct state to transition to, when using forks;
	Function, obtained w/ IDs of currentState and dispatchedAction , is later loaded with values
	from context/payload during root reducer operations.
	Resulting value is the new state of the automata, exact state value depends on which conditions resolve to TRUE inside
*/
export function getPredicates(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	expressions: TExpressionRecord;
}) {
	const { diagram } = props;

	const entries = Object
		.entries(diagram.actionChains)
		.map(([stateName, stateActions]) => stateToPredicates(stateName, stateActions, props))
		.filter(val => val !== null);

	const automataPredicates = Object.fromEntries(entries);

	return automataPredicates;
}

function stateToPredicates(
	stateName: string,
	stateActions: Record<string, TActionChainParams>,
	props: {
		actionDictionary: BasicActionDictionary;
		stateDictionary: BasicStateDictionary;
		expressions: TExpressionRecord;
	},
): [number, { [k: string]: string }] | null {
	const { stateDictionary } = props;
	const originalStateId = stateDictionary.getDictionary()[stateName];
	if (!originalStateId) {
		throw new Error(`Incorrect state: ${stateName}`);
	}
	const statePredicateEntries = Object
		.entries(stateActions)
		.map(([actionName, actionParams]) => actionToPredicate(actionName, actionParams.chains, props))
		.filter(val => val !== null);

	if (!statePredicateEntries || statePredicateEntries.length === 0) return null;

	const statePredicates = Object.fromEntries(statePredicateEntries);
	return [originalStateId, statePredicates];
}

function actionToPredicate(
	action: string,
	chains: TActionChain[],
	props: {
		actionDictionary: BasicActionDictionary;
		stateDictionary: BasicStateDictionary;
		expressions: TExpressionRecord;
	},
): [number, string] | null {
	const { actionDictionary } = props;
	const actionId = actionDictionary.getDictionary()[action];
	if (!actionId) {
		throw new Error(`Incorrect action: ${action}`);
	}
	const stateTransitionConditions = chains
		.map(actionChain => getStateTransitionConditions(actionChain, props))
		.filter(val => val != null);
	const predicate = getPredicateContent(stateTransitionConditions);

	if (!predicate) return null;

	return [actionId, predicate];
}

function getPredicateContent(stateTransitionConditions: string[] | null) {
	if (!stateTransitionConditions || stateTransitionConditions.length === 0) return null;
	return `(prevContext, payload, functionDictionary) => {
		${
			stateTransitionConditions.map((conditions, index) => `
					const state${index + 1} = (function(){
						${conditions}
					})();
					if(state${index + 1}) return state${index + 1};
			`).join('')
		}
		return null;
	}`;
}

function getStateTransitionConditions(
	actionChain: TActionChain,
	props: {
		stateDictionary: BasicStateDictionary;
		expressions: TExpressionRecord;
	},
) {
	const { chain, state } = actionChain;
	const transitionStateId = props.stateDictionary.getDictionary()[state];
	if (!transitionStateId) {
		throw new Error(`Incorrect state: ${state}`);
	}

	const conditions = chain
		.map(segment => resolveChainSegment(segment, { expressionRecord: props.expressions }))
		.map((cond, index) => `const cond${index + 1} = ${cond};`);

	if (conditions.length === 0) return null;

	conditions.push(`
		if(${conditions.map((_, index) => `cond${index + 1} === true`).join(' && ')}) {
			return ${transitionStateId};
		}
		else return undefined;`,
	);
	return conditions.join('\n');
}

/*
	need to check if parts of the chain can be processed by the parser,
	turned into expressions and used later in the generated predicates.

	if they cant be processed (i.e they are internal ids or unrelated names),
	assume the segment resolves to TRUE and move on
*/
function resolveChainSegment(segment: string, props: {
	expressionRecord: TExpressionRecord;
}) {
	const { expressionRecord } = props;
	try {
		const wrappedSegment = `=${segment}?`;
		const processedExpression = parser.parse(wrappedSegment);
		// check the expression property at the top-level of the parsed object
		if (!processedExpression.expression || !isFunctionExpression(processedExpression.expression)) {
			throw new Error('Incorrect expression');
		}
		const expressionValue = expressions.functions.getExpressionValue({
			expression: processedExpression.expression,
			expressionRecord,
		});
		return expressionValue;
	} catch {
		return true;
	}
}
