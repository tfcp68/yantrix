import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { TActionChain, TActionChainParams } from '@yantrix/mermaid-parser';
import {
	getExpressionStatements,
	isFunctionExpression,
	YantrixParser,
} from '@yantrix/yantrix-parser';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';
import { expressions } from '../expressions';

const parser = new YantrixParser();

export type TPredicateTransitionModel = {
	conditions: (string | boolean)[];
	transitionStateId: number;
};

export type TPredicateActionModel = {
	transitions: TPredicateTransitionModel[];
};

export type TPredicatesModel = Record<number, Record<number, TPredicateActionModel>>;

/*
	Predicates object is necessary for resolving the correct state to transition to, when using forks;
	Function, obtained w/ IDs of currentState and dispatchedAction, is later loaded with values
	from context/payload during root reducer operations.
	Resulting value is the new state of the automata, exact state value depends on which conditions resolve to TRUE inside
*/
export function getPredicates(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	expressions: TExpressionRecord;
}): TPredicatesModel {
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
): [number, Record<number, TPredicateActionModel>] | null {
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
): [number, TPredicateActionModel] | null {
	const { actionDictionary } = props;
	const actionId = actionDictionary.getDictionary()[action];
	if (!actionId) {
		throw new Error(`Incorrect action: ${action}`);
	}
	const stateTransitionConditions = chains
		.map(actionChain => getStateTransitionConditions(actionChain, props))
		.filter(val => val != null);

	if (stateTransitionConditions.length === 0) return null;

	return [actionId, {
		transitions: stateTransitionConditions,
	}];
}

function getStateTransitionConditions(
	actionChain: TActionChain,
	props: {
		stateDictionary: BasicStateDictionary;
		expressions: TExpressionRecord;
	},
): TPredicateTransitionModel | null {
	const { chain, state } = actionChain;
	const transitionStateId = props.stateDictionary.getDictionary()[state];
	if (!transitionStateId) {
		throw new Error(`Incorrect state: ${state}`);
	}

	const conditions = chain
		.map(segment => resolveChainSegment(segment, { expressionRecord: props.expressions }));

	if (conditions.length === 0) return null;

	return {
		conditions,
		transitionStateId,
	};
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
		const processedDocument = parser.parse(wrappedSegment);
		const exprStatements = getExpressionStatements(processedDocument);
		if (exprStatements.length === 0) {
			throw new Error('Incorrect expression');
		}
		const expression = exprStatements[0]!.expression;
		if (!isFunctionExpression(expression)) {
			throw new Error('Incorrect expression');
		}
		const expressionValue = expressions.functions.getExpressionValue({
			expression,
			expressionRecord,
		});
		return expressionValue;
	} catch {
		return true;
	}
}
