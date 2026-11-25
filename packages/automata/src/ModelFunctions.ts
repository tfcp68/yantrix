import {
	TAutomataBaseEventType,
	TAutomataEventMetaType,
	TModelPredicate,
	TReadonlyModel,
} from './types/index.js';

/** Reads one typed value from the current `Data Model` snapshot. */
export type TModelSliceSelector<ModelType extends object, SliceType> = (
	model: TReadonlyModel<ModelType>,
) => TReadonlyModel<SliceType>;

/** Replaces a selected value and returns the next `Data Model` snapshot. */
export type TModelSliceUpdater<ModelType extends object, SliceType> = (
	model: TReadonlyModel<ModelType>,
	slice: TReadonlyModel<SliceType>,
) => TReadonlyModel<ModelType>;

/** A `Predicate` scoped to one selected `Data Model` value. */
export type TModelSlicePredicate<
	SliceType,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> = (
	event: TAutomataEventMetaType<EventType, EventMetaType>,
	slice: TReadonlyModel<SliceType>,
) => boolean;

/** A `Model Transformer` projects the `Data Model` as a context-free `Effect`. */
export type TModelTransformer<
	ModelType extends object,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> = (
	event: TAutomataEventMetaType<EventType, EventMetaType>,
	model: TReadonlyModel<ModelType>,
) => TReadonlyModel<ModelType>;

/** A `Model Transformer` scoped to one selected `Data Model` value. */
export type TModelSliceTransformer<
	SliceType,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> = (
	event: TAutomataEventMetaType<EventType, EventMetaType>,
	slice: TReadonlyModel<SliceType>,
) => TReadonlyModel<SliceType>;

/**
 * Lifts a `Predicate` over one selected value into a `Model Predicate`.
 *
 * Keeping selection separate makes the `Data Model` dependency explicit and
 * prevents a domain `Predicate` from knowing the shape of the whole application.
 */
export function createModelPredicate<
	ModelType extends object,
	SliceType,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
>(
	select: TModelSliceSelector<ModelType, SliceType>,
	predicate: TModelSlicePredicate<SliceType, EventType, EventMetaType>,
): TModelPredicate<ModelType, EventType, EventMetaType> {
	return (event, model) => predicate(event, select(model));
}

/**
 * Lifts a pure projection over one selected value into a `Model Transformer`.
 * The updater is skipped when the selected reference/value did not change.
 */
export function createModelTransformer<
	ModelType extends object,
	SliceType,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
>(
	select: TModelSliceSelector<ModelType, SliceType>,
	update: TModelSliceUpdater<ModelType, SliceType>,
	transform: TModelSliceTransformer<SliceType, EventType, EventMetaType>,
): TModelTransformer<ModelType, EventType, EventMetaType> {
	return (event, model) => {
		const currentSlice = select(model);
		const nextSlice = transform(event, currentSlice);
		return Object.is(currentSlice, nextSlice)
			? model
			: update(model, nextSlice);
	};
}

/** Composes `Model Transformers` in declaration order. */
export function composeModelTransformers<
	ModelType extends object,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
>(
	...transformers: ReadonlyArray<TModelTransformer<ModelType, EventType, EventMetaType>>
): TModelTransformer<ModelType, EventType, EventMetaType> {
	return (event, model) => {
		let nextModel = model;
		for (const transformer of transformers) nextModel = transformer(event, nextModel);
		return nextModel;
	};
}

/** True when every `Model Predicate` succeeds. Stops at the first false result. */
export function allModelPredicates<
	ModelType extends object,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
>(
	...predicates: ReadonlyArray<TModelPredicate<ModelType, EventType, EventMetaType>>
): TModelPredicate<ModelType, EventType, EventMetaType> {
	return (event, model) => predicates.every(predicate => predicate(event, model));
}

/** True when at least one `Model Predicate` succeeds. Stops at the first true result. */
export function anyModelPredicates<
	ModelType extends object,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
>(
	...predicates: ReadonlyArray<TModelPredicate<ModelType, EventType, EventMetaType>>
): TModelPredicate<ModelType, EventType, EventMetaType> {
	return (event, model) => predicates.some(predicate => predicate(event, model));
}

/** Negates one `Model Predicate`. */
export function notModelPredicate<
	ModelType extends object,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
>(
	predicate: TModelPredicate<ModelType, EventType, EventMetaType>,
): TModelPredicate<ModelType, EventType, EventMetaType> {
	return (event, model) => !predicate(event, model);
}

/**
 * Produces an `Effect` from a `Model Predicate` and `Model Transformer`.
 * A failed condition preserves the exact current snapshot reference.
 */
export function whenModel<
	ModelType extends object,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
>(
	predicate: TModelPredicate<ModelType, EventType, EventMetaType>,
	transformer: TModelTransformer<ModelType, EventType, EventMetaType>,
): TModelTransformer<ModelType, EventType, EventMetaType> {
	return (event, model) => predicate(event, model)
		? transformer(event, model)
		: model;
}
