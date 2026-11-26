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
	EventMetaType extends { [K in EventType]: any } = Record<EventType, unknown>,
> = (
	event: TAutomataEventMetaType<EventType, EventMetaType>,
	slice: TReadonlyModel<SliceType>,
) => boolean;

/** A `Model Transformer` projects the `Data Model` as a context-free `Effect`. */
export type TModelTransformer<
	ModelType extends object,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, unknown>,
> = (
	event: TAutomataEventMetaType<EventType, EventMetaType>,
	model: TReadonlyModel<ModelType>,
) => TReadonlyModel<ModelType>;

/** A `Model Transformer` scoped to one selected `Data Model` value. */
export type TModelSliceTransformer<
	SliceType,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, unknown>,
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
	Select extends TModelSliceSelector<ModelType, any>,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, unknown>,
>(
	select: Select,
	// Infer the callback's `Event` types from its first parameter. The selector alone supplies the slice.
	predicate: NoInfer<TModelSlicePredicate<ReturnType<Select>, EventType, EventMetaType>>
		& ((event: TAutomataEventMetaType<EventType, EventMetaType>, slice: never) => unknown),
): TModelPredicate<ModelType, EventType, EventMetaType>;
export function createModelPredicate<
	ModelType extends object,
	SliceType,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, unknown>,
>(
	select: TModelSliceSelector<ModelType, SliceType>,
	predicate: NoInfer<TModelSlicePredicate<SliceType, EventType, EventMetaType>>
		& ((event: TAutomataEventMetaType<EventType, EventMetaType>, slice: never) => unknown),
): TModelPredicate<ModelType, EventType, EventMetaType>;
export function createModelPredicate<
	ModelType extends object,
	SliceType,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, unknown>,
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
	Select extends TModelSliceSelector<ModelType, any>,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, unknown>,
>(
	select: Select,
	update: NoInfer<TModelSliceUpdater<ModelType, ReturnType<Select>>>
		& ((model: TReadonlyModel<ModelType>, slice: never) => TReadonlyModel<ModelType>),
	transform: NoInfer<TModelSliceTransformer<ReturnType<Select>, EventType, EventMetaType>>
		& ((event: TAutomataEventMetaType<EventType, EventMetaType>, slice: never) => unknown),
): TModelTransformer<ModelType, EventType, EventMetaType>;
export function createModelTransformer<
	ModelType extends object,
	SliceType,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, unknown>,
>(
	select: TModelSliceSelector<ModelType, SliceType>,
	update: NoInfer<TModelSliceUpdater<ModelType, SliceType>>,
	transform: NoInfer<TModelSliceTransformer<SliceType, EventType, EventMetaType>>
		& ((event: TAutomataEventMetaType<EventType, EventMetaType>, slice: never) => unknown),
): TModelTransformer<ModelType, EventType, EventMetaType>;
export function createModelTransformer<
	ModelType extends object,
	SliceType,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, unknown>,
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
	EventMetaType extends { [K in EventType]: any } = Record<EventType, unknown>,
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
	EventMetaType extends { [K in EventType]: any } = Record<EventType, unknown>,
>(
	...predicates: ReadonlyArray<TModelPredicate<ModelType, EventType, EventMetaType>>
): TModelPredicate<ModelType, EventType, EventMetaType> {
	return (event, model) => predicates.every(predicate => predicate(event, model));
}

/** True when at least one `Model Predicate` succeeds. Stops at the first true result. */
export function anyModelPredicates<
	ModelType extends object,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, unknown>,
>(
	...predicates: ReadonlyArray<TModelPredicate<ModelType, EventType, EventMetaType>>
): TModelPredicate<ModelType, EventType, EventMetaType> {
	return (event, model) => predicates.some(predicate => predicate(event, model));
}

/** Negates one `Model Predicate`. */
export function notModelPredicate<
	ModelType extends object,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, unknown>,
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
	EventMetaType extends { [K in EventType]: any } = Record<EventType, unknown>,
>(
	predicate: TModelPredicate<ModelType, EventType, EventMetaType>,
	transformer: TModelTransformer<ModelType, EventType, EventMetaType>,
): TModelTransformer<ModelType, EventType, EventMetaType> {
	return (event, model) => predicate(event, model)
		? transformer(event, model)
		: model;
}

/**
 * Helpers bound to a `Data Model` and every key in `EventType`.
 * Their `Event Meta` type is `EventMetaType[EventType] | null`.
 * Use `forEvent` when a handler reads the `Event Meta` for a particular key.
 */
export type TModelFunctions<
	ModelType extends object,
	EventType extends TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any },
> = {
	/** Creates a `Model Predicate` for the value inferred from the selector. */
	readonly predicate: <SliceType = any>(
		select: TModelSliceSelector<ModelType, SliceType>,
		predicate: NoInfer<TModelSlicePredicate<SliceType, EventType, EventMetaType>>,
	) => TModelPredicate<ModelType, EventType, EventMetaType>;

	/** Creates a `Model Transformer` that replaces the selected value only when it changes. */
	readonly transformer: <SliceType = any>(
		select: TModelSliceSelector<ModelType, SliceType>,
		update: NoInfer<TModelSliceUpdater<ModelType, SliceType>>,
		transform: NoInfer<TModelSliceTransformer<SliceType, EventType, EventMetaType>>,
	) => TModelTransformer<ModelType, EventType, EventMetaType>;

	/** Runs the `Model Transformers` in declaration order. */
	readonly compose: (
		...transformers: ReadonlyArray<TModelTransformer<ModelType, EventType, EventMetaType>>
	) => TModelTransformer<ModelType, EventType, EventMetaType>;

	/** Tests the `Model Predicates` until one returns false. */
	readonly all: (
		...predicates: ReadonlyArray<TModelPredicate<ModelType, EventType, EventMetaType>>
	) => TModelPredicate<ModelType, EventType, EventMetaType>;

	/** Tests the `Model Predicates` until one returns true. */
	readonly any: (
		...predicates: ReadonlyArray<TModelPredicate<ModelType, EventType, EventMetaType>>
	) => TModelPredicate<ModelType, EventType, EventMetaType>;

	/** Negates a `Model Predicate`. */
	readonly not: (
		predicate: TModelPredicate<ModelType, EventType, EventMetaType>,
	) => TModelPredicate<ModelType, EventType, EventMetaType>;

	/** Creates an `Effect` that applies a `Model Transformer` when its `Model Predicate` succeeds. */
	readonly when: (
		predicate: TModelPredicate<ModelType, EventType, EventMetaType>,
		transformer: TModelTransformer<ModelType, EventType, EventMetaType>,
	) => TModelTransformer<ModelType, EventType, EventMetaType>;

	/** Binds one `Event` key at compile time. The `Effect Matrix` key determines when a handler runs. */
	readonly forEvent: <Event extends EventType>() => TModelFunctions<ModelType, Event, EventMetaType>;
};

const modelFunctions = Object.freeze({
	predicate: createModelPredicate,
	transformer: createModelTransformer,
	compose: composeModelTransformers,
	all: allModelPredicates,
	any: anyModelPredicates,
	not: notModelPredicate,
	when: whenModel,
	forEvent: () => modelFunctions,
});

/**
 * Binds the shared `Model Predicate` and `Model Transformer` helpers to the `Data Model` and `Event` types.
 * At builder level, `meta` is the union of `Event Meta` values for every key in `EventType`, plus `null`.
 * Use `forEvent` for handlers that read a particular key's `Event Meta`. Both calls return the same frozen helpers.
 */
export function createModelFunctions<
	ModelType extends object,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, unknown>,
>(): TModelFunctions<ModelType, EventType, EventMetaType> {
	return modelFunctions;
}
