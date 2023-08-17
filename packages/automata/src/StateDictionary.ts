import { uniqId } from '@yantrix/utils';
import { AbstractBaseClass } from './mixins/BaseClass.js';
import DictionaryContainer from './mixins/DictionaryContainer.js';
import ExtendedStateContainer from './mixins/ExtendedStateContainer.js';
import {
	TStateKeysCollection,
	TStateLookupParams,
	TStateValuesCollection,
} from './types/dictionaries.js';
import {
	TAbstractConstructor,
	TAutomataBaseStateType,
	TAutomataStateContext,
	TContextTransformer,
} from './types/index.js';
import { IStateDictionary } from './types/interfaces.js';

type TTransformerDictionaryItem<
	StateType extends TAutomataBaseStateType = TAutomataBaseStateType,
	ContextType extends { [K in StateType]: any } = Record<StateType, any>,
> = {
	state: StateType;
	transformer: TContextTransformer<StateType, ContextType>;
};

export function createStateDictionary<
	StateType extends TAutomataBaseStateType = TAutomataBaseStateType,
	ContextType extends { [K in StateType]: any } = Record<StateType, any>,
>() {
	return <BaseType extends TAbstractConstructor = TAbstractConstructor>(
		Base: BaseType,
	) =>
		class AbstractStateDictionary extends DictionaryContainer<StateType>()(
			ExtendedStateContainer<StateType, ContextType>()(Base),
		) {
			#transformers: {
				[K in StateType]?: Record<
					string,
					{
						namespace?: string;
						transformer: TContextTransformer<K, ContextType>;
					}
				>;
			} = {};

			#transformersIndex: Record<string, StateType> = {};

			getStateKeys({
				states = [],
				namespace = undefined,
			}: TStateValuesCollection<StateType>): Array<string | null> {
				return (states ?? []).map((state) => {
					if (!this.validateState(state)) return null;
					const data = this._getValueData(state);
					if (!data) return null;
					if (namespace !== null && namespace !== data.namespace)
						return null;
					return data.key;
				});
			}

			clearStates(namespace?: string) {
				return this._clearItems(namespace);
			}

			removeStates(
				{
					namespace,
					states = [],
					keys = [],
				}: TStateLookupParams<StateType>,
				removeContextTransformers?: boolean,
			) {
				const StatesToDelete = [
					...states.filter(this.validateState),
					...keys.map((StateKey) =>
						this._findItem(StateKey as string, namespace),
					),
				].filter((v) => v != null) as StateType[];
				const stateKeys = StatesToDelete.map((State) =>
					this._getValueData(State),
				).filter(
					(data) =>
						!!data &&
						(namespace == null || namespace === data?.namespace),
				);
				for (const StateKey of stateKeys)
					if (StateKey) {
						this._deleteItemKey(StateKey.key);
					}
				if (removeContextTransformers) {
					StatesToDelete.flatMap((State) =>
						Object.keys(this.#transformers[State] ?? {}),
					).forEach((id) => this.removeContextTransformerById(id));
				}
				return this;
			}

			getStateValues({
				namespace = undefined,
				keys = [],
			}: TStateKeysCollection<StateType>): Array<StateType | null> {
				return (keys ?? []).map((StateKey) =>
					this._findItem(StateKey as string, namespace),
				);
			}

			addStates({
				namespace = undefined,
				keys,
			}: TStateKeysCollection<StateType>): StateType[] {
				return (keys || []).map((k) =>
					this._addItemKey(k as string, namespace),
				);
			}

			addContextTransformer<T extends StateType>(
				state: T,
				transformer: TContextTransformer<T, ContextType>,
				namespace?: string,
			): string {
				const id = this.#getTransformerKey(state, namespace);
				this.#transformersIndex[id] = state;
				this.#transformers[state] = Object.assign(
					this.#transformers[state] ?? {},
					{
						[id]: { namespace, transformer },
					},
				);
				return id;
			}

			removeContextTransformerById(id: string): this {
				if (this.#transformersIndex[id]) {
					const state = this.#transformersIndex[id];
					if (state && this.#transformers?.[state]?.[id]) {
						this.#transformers[state] = Object.fromEntries(
							Object.entries(
								this.#transformers[state] ?? {},
							).filter(([key]) => key !== id),
						);
					}
					delete this.#transformersIndex[id];
				}
				return this;
			}

			removeContextTransformer<T extends StateType>(
				state: T,
				transformer: TContextTransformer<T, ContextType>,
				namespace: string | undefined,
			): this {
				Object.keys(this.#transformers[state] ?? {}).find((id) => {
					const item = this.#transformers[state]?.[id];
					if (!item) return false;
					if (
						item.transformer === transformer &&
						(item?.namespace || null) === (namespace || null)
					)
						this.removeContextTransformerById(id);
					return true;
				});
				return this;
			}

			getContextTransformers(namespace?: string) {
				return Object.keys(this.#transformers).reduce(
					(obj, state) => ({
						...obj,
						[state]: Object.fromEntries(
							Object.entries(
								this.#transformers[
									state as unknown as StateType
								] ?? {},
							).filter(
								([, value]) =>
									(value.namespace || null) ===
									(namespace || null),
							),
						),
					}),
					{},
				);
			}

			runContextTransformers<T extends StateType>(
				id: string,
				context: TAutomataStateContext<T, ContextType>,
			): TAutomataStateContext<StateType, ContextType> {
				const stateType = this.#transformersIndex[id];
				if (stateType !== context?.state) return context;
				const transformers =
					this.#transformers[stateType]?.[id]?.transformer;
				if (!transformers) return context;
				return transformers(context);
			}

			#getTransformerKey(state: StateType, namespace?: string) {
				return this._getItemKey(state + '/' + uniqId(), namespace);
			}
		};
}

export class BasicStateDictionary
	extends createStateDictionary<
		TAutomataBaseStateType,
		Record<TAutomataBaseStateType, any>
	>()(AbstractBaseClass)
	implements
		IStateDictionary<
			TAutomataBaseStateType,
			Record<TAutomataBaseStateType, any>
		>
{
	constructor() {
		super();
	}
}

export default BasicStateDictionary;
