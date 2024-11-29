import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { StartState } from '@yantrix/mermaid-parser';
import {
	ExpressionTypes,
	isContextWithReducer,
	isKeyItemReference,
	isKeyItemWithExpression,
	TContextItem,
	TKeyItems,
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
	ctx: TContextItem;
	expressions: TExpressionRecord;
}) {
	if (isContextWithReducer(props.ctx)) {
		const { context, reducer } = props.ctx;

		return getBoundValues({
			expressions: props.expressions,
			arr: mapReducerItems({ reducer, expressions: props.expressions }),
			context,
		});
	} else {
		const { context } = props.ctx;
		return context.map(({ keyItem }) => {
			const { identifier } = keyItem;
			if (isKeyItemWithExpression(keyItem)) {
				const expressionValue = expressions.functions.getExpressionValue({
					expression: keyItem.expression,
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
	reducer: TKeyItems<'reducer'>;
	sourcePath?: string;
	expressions: TExpressionRecord;
}) {
	return props.reducer
		.map(({ keyItem }) => {
			if (isKeyItemReference(keyItem)) {
				const { expressionType, identifier: boundIdentifier } = keyItem;
				const path = props.sourcePath ?? pathRecord[expressionType];

				if (keyItem.expressionType === ExpressionTypes.Constant) {
					const expressionValueRight = expressions.functions.getExpressionValue({
						expression: keyItem,
						expressionRecord: props.expressions,
					});
					return `(function(){
							return ${expressionValueRight}
							}())`;
				}

				if (isKeyItemWithExpression(keyItem)) {
					const { expression } = keyItem;

					const expressionValueRight = expressions.functions.getExpressionValue({
						expression,
						expressionRecord: props.expressions,
					});

					return expressions.serializer.getDefaultPropertyContext(path, boundIdentifier, expressionValueRight);
				}

				return expressions.serializer.getDefaultPropertyContext(path, boundIdentifier);
			} else {
				const { expression } = keyItem;

				const expressionValueRight = expressions.functions.getExpressionValue({
					expression,
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
	context: any;
}) {
	return props.arr
		.map((el, index) => {
			const item = props.context[index];
			if (!item) {
				throw new Error('Unexpected index bound property');
			}
			const { keyItem } = item;
			const { identifier: targetProperty } = keyItem;

			if (isKeyItemWithExpression(keyItem)) {
				const { expression } = keyItem;

				const expressionValueRight = expressions.functions.getExpressionValue({
					expression,
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

	diagramState.notes?.contextDescription.forEach((ctx) => {
		const newContext = getContextItem({
			ctx,
			expressions: props.expressions,
		});

		ctxRes.push(...newContext);
	});

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

		return `${stateValue}: (prevContext, payload, functionDictionary) => {

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
};
