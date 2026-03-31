import { BasicStateDictionary } from '@yantrix/automata';
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

export type TReducerSourceVM =
	| {
		kind: 'defaultProperty';
		path: string;
		identifier: string;
		fallbackExpression: string | null;
	}
	| {
		kind: 'expression';
		expressionValueRight: string;
	}
	| {
		kind: 'constant';
		expressionValueRight: string;
	};

export type TReducerBoundValueVM = {
	targetProperty: string;
	source: TReducerSourceVM;
	defaultExpressionValueRight: string | null;
};

export type TContextItemVM =
	| {
		kind: 'withReducer';
		boundValues: TReducerBoundValueVM[];
	}
	| {
		kind: 'noReducer';
		identifier: string;
		defaultExpressionValueRight: string | null;
	};

export type TContextTransitionVM =
	| {
		kind: 'prevContext';
	}
	| {
		kind: 'object';
		items: TContextItemVM[];
	};

export type TStateReducerEntryVM = {
	stateValue: number;
	transition: TContextTransitionVM;
};

function getContextItemModel(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	expressions: TExpressionRecord;
}) {
	return props.diagram.states.map((state) => {
		const stateValue = props.stateDictionary.getStateValues({ keys: [state.id] })[0];

		if (stateValue == null) {
			throw new Error('Invalid state');
		}

		return {
			stateValue,
			transition: getContextTransitionModel({
				value: stateValue,
				stateDictionary: props.stateDictionary,
				diagram: props.diagram,
				expressions: props.expressions,
			}),
		};
	});
}

function getContextItem(props: {
	ctx: ContextStatement;
	expressions: TExpressionRecord;
}): TContextItemVM[] {
	if (hasReducer(props.ctx)) {
		const boundValues = getBoundValuesModel({
			expressions: props.expressions,
			arr: mapReducerItemsModel({ reducer: props.ctx.reducer, expressions: props.expressions }),
			context: props.ctx.items,
		});

		return [{
			kind: 'withReducer',
			boundValues,
		}];
	} else {
		const { items } = props.ctx;
		return items.map((rawKeyItem) => {
			const { identifier, defaultValue } = rawKeyItem;
			if (defaultValue) {
				const defaultExpressionValueRight = expressions.functions.getExpressionValue({
					expression: defaultValue,
					expressionRecord: props.expressions,
				});

				return {
					kind: 'noReducer',
					identifier,
					defaultExpressionValueRight,
				};
			} else {
				return {
					kind: 'noReducer',
					identifier,
					defaultExpressionValueRight: null,
				};
			}
		});
	}
};

function mapReducerItemsModel(props: {
	reducer: KeyItem[];
	sourcePath?: string;
	expressions: TExpressionRecord;
}): TReducerSourceVM[] {
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

					return {
						kind: 'constant',
						expressionValueRight,
					};
				}

				if (!path) {
					throw new Error(`Unknown reference type: ${refType}`);
				}

				if (keyItem.assignedExpression) {
					const fallbackExpression = expressions.functions.getExpressionValue({
						expression: keyItem.assignedExpression,
						expressionRecord: props.expressions,
					});

					return {
						kind: 'defaultProperty',
						path,
						identifier: boundIdentifier,
						fallbackExpression,
					};
				}

				return {
					kind: 'defaultProperty',
					path,
					identifier: boundIdentifier,
					fallbackExpression: null,
				};
			} else {
				const expressionValueRight = expressions.functions.getExpressionValue({
					expression: keyItem,
					expressionRecord: props.expressions,
				});

				return {
					kind: 'expression',
					expressionValueRight,
				};
			}
		});
}

function getBoundValuesModel(props: {
	expressions: TExpressionRecord;
	arr: TReducerSourceVM[];
	context: RawKeyItem[];
}): TReducerBoundValueVM[] {
	return props.arr
		.map((source, index) => {
			const item = props.context[index];
			if (!item) {
				throw new Error('Unexpected index bound property');
			}
			const targetProperty = item.identifier;

			if (item.defaultValue) {
				const defaultExpressionValueRight = expressions.functions.getExpressionValue({
					expression: item.defaultValue,
					expressionRecord: props.expressions,
				});

				return {
					targetProperty,
					source,
					defaultExpressionValueRight,
				};
			} else {
				return {
					targetProperty,
					source,
					defaultExpressionValueRight: null,
				};
			}
		});
}

function getContextTransitionModel(props: {
	value: number;
	stateDictionary: BasicStateDictionary;
	diagram: TStateDiagramMatrixIncludeNotes;
	expressions: TExpressionRecord;
}): TContextTransitionVM {
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

	const ctxRes: TContextItemVM[] = [];

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

	if (ctxRes.length === 0) {
		return { kind: 'prevContext' };
	}

	return {
		kind: 'object',
		items: ctxRes,
	};
};

function getReducerModel(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	expressions: TExpressionRecord;
}) {
	return {
		entries: getContextItemModel({
			diagram: props.diagram,
			stateDictionary: props.stateDictionary,
			expressions: props.expressions,
		}),
	};
}

function getDefaultContextModel(props: {
	stateDictionary: BasicStateDictionary;
	diagram: TStateDiagramMatrixIncludeNotes;
	expressions: TExpressionRecord;
}) {
	const startStateValue = props.stateDictionary.getStateValues({ keys: [StartState] })[0] ?? null;

	if (startStateValue != null) {
		const transition = getContextTransitionModel({
			diagram: props.diagram,
			expressions: props.expressions,
			stateDictionary: props.stateDictionary,
			value: startStateValue,
		});

		return {
			startStateValue,
			transition,
		};
	}

	return {
		startStateValue: null,
		transition: null,
	};
}

export const contextSerializer = {
	getReducerModel,
	getContextItem,
	mapReducerItemsModel,
	getBoundValuesModel,
	getDefaultContextModel,
	getContextTransitionModel,
};
