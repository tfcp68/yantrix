import {
	createModelFunctions,
	IDataModelStore,
	ModelStore,
	TAutomataEffect,
	TAutomataEventMetaType,
	TEffectMatrix,
	TModelPredicate,
	TReadonlyModel,
} from '@yantrix/automata';
import {
	createModelPredicate,
	createModelTransformer,
	createModelFunctions as fromModelFunctions,
	TModelFunctions,
	TModelSlicePredicate,
	TModelSliceTransformer,
	TModelTransformer,
	whenModel,
} from '@yantrix/automata/ModelFunctions';
import { mergeModelObject, removeModelItem, removeModelProperty, setModelProperty, updateModelItem, updateModelProperty } from '@yantrix/automata/ModelUpdates';
import { assertSerializableModel } from '@yantrix/automata/ModelValidation';

interface IModel {
	cart: { skus: string[] };
	status: 'open';
	window: [number, number];
}

enum CartEvent {
	Add = 1,
	Reset = 2,
}

interface IEventMeta {
	[CartEvent.Add]: { sku: string };
	[CartEvent.Reset]: { reason: string };
}

type TEqual<Left, Right> = (<T>() => T extends Left ? 1 : 2) extends (<T>() => T extends Right ? 1 : 2)
	? true
	: false;

function expectExactType<Actual, Expected>(proof: TEqual<Actual, Expected>) {
	return proof;
}

const initial: IModel = { cart: { skus: ['A'] }, status: 'open', window: [0, 2] };
const event: TAutomataEventMetaType<CartEvent.Add, IEventMeta> = { event: CartEvent.Add, meta: { sku: 'A' } };
const fx = createModelFunctions<IModel, CartEvent, IEventMeta>();
expectExactType<typeof fx, TModelFunctions<IModel, CartEvent, IEventMeta>>(true);
if (fx !== fromModelFunctions<IModel, CartEvent, IEventMeta>()) throw new Error('Expected the same public builder');
const add = fx.forEvent<CartEvent.Add>();
const hasSku = add.predicate(
	(model: TReadonlyModel<IModel>) => model.cart,
	(event, cart) => {
		expectExactType<typeof cart, { readonly skus: readonly string[] }>(true);
		expectExactType<typeof event.meta, IEventMeta[CartEvent.Add] | null>(true);
		return event.meta !== null && cart.skus.includes(event.meta.sku);
	},
);

const sameList: TModelSliceTransformer<string[]> = (_event, skus) => skus;
const keepSkus: TModelTransformer<IModel, CartEvent.Add, IEventMeta> = createModelTransformer(
	model => model.cart.skus,
	(model, skus) => {
		expectExactType<typeof skus, readonly string[]>(true);
		return { ...model, cart: { ...model.cart, skus } };
	},
	sameList,
);
const guarded = whenModel(hasSku, keepSkus);
expectExactType<Parameters<typeof guarded>[0], TAutomataEventMetaType<CartEvent.Add, IEventMeta>>(true);
const sameSnapshot: TModelTransformer<IModel, CartEvent.Add, IEventMeta> = (_event, model) => model;
const existingEffect: TAutomataEffect<IModel, CartEvent.Add, IEventMeta> = (_event, model) => model;
const fromEffect: IModel = existingEffect(event, initial);
const anyEvent = fx.transformer(
	model => model.cart.skus,
	(model, skus) => ({ ...model, cart: { skus } }),
	(event, skus) => {
		expectExactType<typeof event.meta, IEventMeta[CartEvent] | null>(true);
		expectExactType<typeof skus, readonly string[]>(true);
		return skus;
	},
);
const effects = {
	[CartEvent.Add]: [guarded, sameSnapshot, anyEvent, existingEffect],
	[CartEvent.Reset]: [anyEvent, createModelTransformer(
		model => model.window,
		(model, window) => ({ ...model, window }),
		(event, window) => {
			expectExactType<typeof event.meta, IEventMeta[CartEvent.Reset] | null>(true);
			expectExactType<typeof window, readonly [number, number]>(true);
			return window;
		},
	)],
} satisfies TEffectMatrix<IModel, CartEvent, IEventMeta>;

assertSerializableModel(fromEffect);
if (!hasSku(event, initial) || effects[CartEvent.Add].some(effect => effect(event, initial) !== initial))
	throw new Error('Expected the no-op effects to preserve the snapshot');
if (updateModelItem(initial.cart.skus, 0, sku => sku)[0] !== 'A')
	throw new Error('Expected the original list item');

const store = new ModelStore<IModel>(initial);
const observable: IDataModelStore<IModel> = store;
const commits: IModel[] = [];
observable.subscribe(model => commits.push(model));
const appendSku = add.transformer(
	model => model.cart.skus,
	(model, skus) => ({ ...model, cart: { skus } }),
	(event, skus) => event.meta === null ? skus : [...skus, event.meta.sku],
);
const next = appendSku({ event: CartEvent.Add, meta: { sku: 'B' } }, initial);
observable.commit(next);
store.commit(sameSnapshot(event, store.get()));
if (store.get() !== next || next.cart.skus[1] !== 'B' || commits.length !== 1 || commits[0] !== next)
	throw new Error('Expected one commit of the exact transformer result');

export function checkModelFunctionInputs() {
	const selectUnknown = (model: TReadonlyModel<IModel>): unknown => model.cart;
	fx.predicate(selectUnknown, (_event, slice) => {
		expectExactType<typeof slice, unknown>(true);
		return slice !== null;
	});
	fx.transformer(selectUnknown, model => model, (_event, slice) => {
		expectExactType<typeof slice, unknown>(true);
		// @ts-expect-error An unknown slice must be narrowed before reading its properties.
		return slice.skus;
	});
	// @ts-expect-error An Add handler cannot consume a Reset event.
	const wrongKey: TEffectMatrix<IModel, CartEvent, IEventMeta> = { [CartEvent.Reset]: [guarded] };
	// @ts-expect-error Only Reset metadata contains a reason.
	add.predicate(model => model.cart, event => event.meta?.reason === 'manual');
	// @ts-expect-error The selected array contains strings.
	add.transformer(model => model.cart.skus, model => model, () => [42]);
	// @ts-expect-error A transform cannot widen the selected literal to 'open' | 'closed'.
	fx.transformer(model => model.status, model => model, () => 'closed' as const);
	const wrongStatus: TModelTransformer<IModel, CartEvent.Add, IEventMeta> = createModelTransformer(
		model => model.status,
		model => model,
		// @ts-expect-error An annotated standalone target still infers the literal only from the selector.
		() => 'closed' as const,
	);
	// @ts-expect-error A mutable selector cannot accept a snapshot with read-only arrays.
	add.predicate((model: IModel) => model.cart, () => true);
	createModelPredicate(model => model, (event) => {
		expectExactType<typeof event.meta, unknown>(true);
		// @ts-expect-error No metadata map or contextual result type was supplied.
		return event.meta?.sku === 'A';
	});
	return { wrongKey, wrongStatus };
}

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
