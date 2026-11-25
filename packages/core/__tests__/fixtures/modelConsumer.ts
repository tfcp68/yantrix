import { TAutomataEffect, TEffectMatrix, TModelPredicate } from '@yantrix/automata';
import { createModelTransformer, TModelSlicePredicate, TModelSliceTransformer, TModelTransformer, whenModel } from '@yantrix/automata/ModelFunctions';
import { mergeModelObject, removeModelItem, removeModelProperty, setModelProperty, updateModelItem, updateModelProperty } from '@yantrix/automata/ModelUpdates';
import { assertSerializableModel } from '@yantrix/automata/ModelValidation';

interface IModel {
	cart: { skus: string[] };
}

type TMeta = { 1: { sku: string } };

const initial: IModel = { cart: { skus: ['A'] } };
const event = { event: 1 as const, meta: { sku: 'A' } };
const hasSku: TModelPredicate<IModel, 1, TMeta> = (event, model) =>
	event.meta !== null && model.cart.skus.includes(event.meta.sku);

const sameList: TModelSliceTransformer<string[]> = (_event, skus) => skus;
const keepSkus = createModelTransformer<IModel, string[], 1, TMeta>(
	model => model.cart.skus,
	(model, skus) => ({ ...model, cart: { ...model.cart, skus } }),
	sameList,
);
const sameSnapshot: TModelTransformer<IModel, 1, TMeta> = (_event, model) => model;
const existingEffect: TAutomataEffect<IModel, 1, TMeta> = (_event, model) => model;
const fromEffect: IModel = existingEffect(event, initial);
const effects: TEffectMatrix<IModel, 1, TMeta> = { 1: [whenModel(hasSku, keepSkus), sameSnapshot, existingEffect] };

assertSerializableModel(fromEffect);
if (!hasSku(event, initial) || effects[1]!.some(effect => effect(event, initial) !== initial))
	throw new Error('Expected the no-op effects to preserve the snapshot');
if (updateModelItem(initial.cart.skus, 0, sku => sku)[0] !== 'A')
	throw new Error('Expected the original list item');

export const checkPredicateInput: TModelPredicate<IModel> = (_event, model) => {
	// @ts-expect-error A predicate cannot append to nested model data.
	model.cart.skus.push('B');
	return false;
};
export const checkSelectedInput: TModelSlicePredicate<IModel['cart']> = (_event, cart) => {
	// @ts-expect-error A selected object also exposes a read-only nested list.
	cart.skus.push('B');
	return false;
};

export function checkUpdateInputs(pair: readonly [string, number]) {
	// @ts-expect-error Object helpers cannot spread an array into a plain record.
	setModelProperty([10, 20], 0, 12);
	// @ts-expect-error Object helpers cannot spread an array into a plain record.
	updateModelProperty([10, 20], 0, () => 12);
	// @ts-expect-error Object helpers cannot spread an array into a plain record.
	mergeModelObject([10, 20], [12]);
	// @ts-expect-error Object helpers cannot spread an array into a plain record.
	removeModelProperty([10, 20], 0);
	// @ts-expect-error The first tuple item is a string.
	updateModelItem(pair, 0, () => 7);
	// @ts-expect-error Removing an item cannot promise a number at the old position.
	removeModelItem(pair, 0)[1].toFixed();
}
