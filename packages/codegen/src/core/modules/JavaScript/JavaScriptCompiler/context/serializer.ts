import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { StartState } from '@yantrix/mermaid-parser';
import {
	ContextStatement,
	getContextStatements,
	getReferenceIdentifier,
	getReferenceType,
	hasReducer,
	isConstant,
	isDataObject,
	KeyItem,
	RawKeyItem,
} from '@yantrix/yantrix-parser';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';
import { pathRecord } from '../../../../shared';
import { expressions } from '../expressions';

function getStateReducerCode(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	expressions: TExpressionRecord;
}) {
	return `const reducer = {
		${getStateToContext(props).join(',\n\t')}
	}`;
}

function getContextItem(props: {
	ctx: ContextStatement;
	expressions: TExpressionRecord;
}) {
	if (hasReducer(props.ctx)) {
		const { items, reducer } = props.ctx;

		return getBoundValues({
			expressions: props.expressions,
			arr: mapReducerItems({ reducer, expressions: props.expressions }),
			context: items,
		});
	} else {
		const { items } = props.ctx;
		return items.map((rawKeyItem) => {
			const { identifier, defaultValue } = rawKeyItem;
			if (defaultValue) {
				const expressionValue = expressions.functions.getExpressionValue({
					expression: defaultValue,
					expressionRecord: props.expressions,
				});

				return `${identifier}: ${expressions.serializer.getDefaultPropertyContext('prevContext', identifier, expressionValue)}`;
			} else {
				return `${identifier}: ${expressions.serializer.getDefaultPropertyContext('prevContext', identifier)}`;
			}
		});
	}
};

function mapReducerItems(props: {
	reducer: KeyItem[];
	sourcePath?: string;
	expressions: TExpressionRecord;
}) {
	return props.reducer
		.map((keyItem) => {
			if (isDataObject(keyItem)) {
				const refType = getReferenceType(keyItem);
				const boundIdentifier = getReferenceIdentifier(keyItem);
				const path = props.sourcePath ?? pathRecord[refType];

				if (isConstant(keyItem.reference)) {
					const expressionValueRight = expressions.functions.getExpressionValue({
						expression: keyItem,
						expressionRecord: props.expressions,
					});
					return `(function(){
							return ${expressionValueRight}
							}())`;
				}

				if (!path) {
					throw new Error(`Unknown reference type: ${refType}`);
				}

				if (keyItem.assignedExpression) {
					const expressionValueRight = expressions.functions.getExpressionValue({
						expression: keyItem.assignedExpression,
						expressionRecord: props.expressions,
					});

					return expressions.serializer.getDefaultPropertyContext(path, boundIdentifier, expressionValueRight);
				}

				return expressions.serializer.getDefaultPropertyContext(path, boundIdentifier);
			} else {
				const expressionValueRight = expressions.functions.getExpressionValue({
					expression: keyItem,
					expressionRecord: props.expressions,
				});
				return `(function(){
						return ${expressionValueRight}
					}())`;
			}
		});
}

function getBoundValues(props: {
	expressions: TExpressionRecord;
	arr: string[];
	context: RawKeyItem[];
}) {
	return props.arr
		.map((el, index) => {
			const item = props.context[index];
			if (!item) {
				throw new Error('Unexpected index bound property');
			}
			const targetProperty = item.identifier;

			if (item.defaultValue) {
				const expressionValueRight = expressions.functions.getExpressionValue({
					expression: item.defaultValue,
					expressionRecord: props.expressions,
				});

				return `${targetProperty}: (function(){
			const boundValue = ${el}
			if(boundValue !== null){
				return boundValue
			}
			else {
				return ${expressionValueRight}
			}

		}())`;
			} else {
				return `${targetProperty}: (function(){
			const boundValue = ${el}

			return boundValue

		}())`;
			}
		});
}

function getContextTransition(props: {
	value: number;
	stateDictionary: BasicStateDictionary;
	diagram: TStateDiagramMatrixIncludeNotes;
	expressions: TExpressionRecord;
}) {
	const stateFromDict = props.stateDictionary.getStateKeys({ states: [props.value] })[0];

	if (stateFromDict === null) {
		throw new Error(`Invalid state - ${props.value}`);
	}

	const diagramState = props.diagram.states.find((diagramState) => {
		return diagramState.id === stateFromDict;
	});

	if (!diagramState) {
		throw new Error(`Invalid state - ${props.value}`);
	}

	const ctxRes: string[] = [];

	if (diagramState.notes) {
		const contextStatements = getContextStatements(diagramState.notes);
		contextStatements.forEach((ctx) => {
			const newContext = getContextItem({
				ctx,
				expressions: props.expressions,
			});

			ctxRes.push(...newContext);
		});
	}

	if (ctxRes.length === 0) return 'prevContext';

	return `{${ctxRes.join(',\n\t')}}`;
};

function getStateToContext(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	expressions: TExpressionRecord;
}) {
	return props.diagram.states.map((state) => {
		const stateValue = props.stateDictionary.getStateValues({ keys: [state.id] })[0];

		if (!stateValue) {
			throw new Error('Invalid state');
		}

		return `${stateValue}: (prevContext, payload, functionDictionary, automata) => {

				return ${getContextTransition({
					value: stateValue,
					stateDictionary: props.stateDictionary,
					diagram: props.diagram,
					expressions: props.expressions,
				})}
			}`;
	});
}

function getDefaultContext(props: {
	stateDictionary: BasicStateDictionary;
	diagram: TStateDiagramMatrixIncludeNotes;
	expressions: TExpressionRecord;
}) {
	const state = props.stateDictionary.getStateValues({ keys: [StartState] })[0];

	if (state) {
		const ctx = getContextTransition({
			diagram: props.diagram,
			expressions: props.expressions,
			stateDictionary: props.stateDictionary,
			value: state,
		});

		return `const getDefaultContext = (prevContext, payload) => {
				const ctx = ${ctx}
				return  Object.assign({}, prevContext, ctx);
			}
			`;
	}

	return `const getDefaultContext = (prevContext, payload) => {
				return prevContext
		}`;
}

export const contextSerializer = {
	getStateReducerCode,
	getContextItem,
	mapReducerItems,
	getBoundValues,
	getStateToContext,
	getDefaultContext,
	getContextTransition,
};
