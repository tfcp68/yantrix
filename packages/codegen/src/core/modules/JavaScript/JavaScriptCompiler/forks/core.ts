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
export async function getPredicates(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	expressions: TExpressionRecord;
}) {
	const { diagram } = props;

	const entries = Object
		.entries(diagram.actionChains)
		.map(async ([stateName, stateActions]) => await stateToPredicates(stateName, stateActions, props));

	const entriesFiltered = await Promise.all(entries);

	const automataPredicates = Object.fromEntries(entriesFiltered.filter(v => v !== null));

	return automataPredicates;
}

async function stateToPredicates(
	stateName: string,
	stateActions: Record<string, TActionChainParams>,
	props: {
		actionDictionary: BasicActionDictionary;
		stateDictionary: BasicStateDictionary;
		expressions: TExpressionRecord;
	},
): Promise<[number, { [k: string]: string }] | null> {
	const { stateDictionary } = props;
	const originalStateId = stateDictionary.getDictionary()[stateName];
	if (!originalStateId) {
		throw new Error(`Incorrect state: ${stateName}`);
	}
	const statePredicateEntries = Object
		.entries(stateActions)
		.map(async ([actionName, actionParams]) => await actionToPredicate(actionName, actionParams.chains, props));

	const statePredicateEntriesAll = (await Promise.all(statePredicateEntries)).filter(val => val !== null);
	if (!statePredicateEntriesAll || statePredicateEntriesAll.length === 0) return null;

	const statePredicates = Object.fromEntries(statePredicateEntriesAll);
	return [originalStateId, statePredicates];
}

async function actionToPredicate(
	action: string,
	chains: TActionChain[],
	props: {
		actionDictionary: BasicActionDictionary;
		stateDictionary: BasicStateDictionary;
		expressions: TExpressionRecord;
	},
): Promise<[number, string] | null> {
	const { actionDictionary } = props;
	const actionId = actionDictionary.getDictionary()[action];
	if (!actionId) {
		throw new Error(`Incorrect action: ${action}`);
	}
	const stateTransitionConditions = chains
		.map(async actionChain => await getStateTransitionConditions(actionChain, props));

	const stateTransitionConditionsAll = await Promise.all(stateTransitionConditions);

	const predicate = getPredicateContent(stateTransitionConditionsAll.filter(val => val != null));

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

async function getStateTransitionConditions(
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
		.map(async segment => await resolveChainSegment(segment, { expressionRecord: props.expressions }));

	const res = await Promise.all(conditions);
	const cnd = res.map((cond, index) => `const cond${index + 1} = ${cond};`);

	if (cnd.length === 0) return null;

	cnd.push(`
		if(${res.map((_, index) => `cond${index + 1} === true`).join(' && ')}) {
			return ${transitionStateId};
		}
		else return undefined;`,
	);
	return cnd.join('\n');
}

/*
	need to check if parts of the chain can be processed by the parser,
	turned into expressions and used later in the generated predicates.

	if they cant be processed (i.e they are internal ids or unrelated names),
	assume the segment resolves to TRUE and move on
*/
async function resolveChainSegment(segment: string, props: {
	expressionRecord: TExpressionRecord;
}) {
	const { expressionRecord } = props;
	try {
		const wrappedSegment = `=${segment}?`;
		const processedExpression = await parser.parse(wrappedSegment);
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
