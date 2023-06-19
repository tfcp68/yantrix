import { DictionaryContainer } from './mixins/DictionaryContainer.js';
import { ExtendedActionContainer } from './mixins/ExtendedActionContainer.js';
import {
	TActionKeysCollection,
	TActionLookupParams,
	TActionValuesCollection,
} from './types/dictionaries.js';
import {
	TAbstractConstructor,
	TAutomataBaseActionType,
} from './types/index.js';
import { IActionDictionary } from './types/interfaces.js';

export const ActionDictionary = <
	ActionType extends TAutomataBaseActionType,
	PayloadType extends { [K in ActionType]: any },
	TBase extends TAbstractConstructor = TAbstractConstructor
>(
	Proto: TBase
) =>
	class ActionDictionary
		extends DictionaryContainer<ActionType>(
			ExtendedActionContainer<ActionType, PayloadType>(Proto)
		)
		implements IActionDictionary<ActionType, PayloadType>
	{
		public getActionKeys({
			actions = [],
			namespace = undefined,
		}: TActionValuesCollection<ActionType>): Array<string | null> {
			return (actions ?? []).map((action) => {
				if (!this.validateAction(action)) return null;
				const data = this._getValueData(action);
				if (!data) return null;
				if (namespace !== null && namespace !== data.namespace)
					return null;
				return data.key;
			});
		}

		public clearActions(namespace?: string) {
			return this._clearItems(namespace);
		}

		public removeActions({
			namespace,
			actions = [],
			keys = [],
		}: TActionLookupParams<ActionType>) {
			const actionsToDelete = [
				...actions.filter(this.validateAction),
				...keys.map((actionKey) =>
					this._findItem(actionKey as string, namespace)
				),
			].filter((v) => v != null) as ActionType[];
			const actionKeys = actionsToDelete
				.map((action) => this._getValueData(action))
				.filter(
					(data) =>
						!!data &&
						(namespace == null || namespace === data?.namespace)
				);
			for (const actionKey of actionKeys)
				if (actionKey) this._deleteItemKey(actionKey.key);
			return this;
		}

		public getActionValues({
			namespace = undefined,
			keys = [],
		}: TActionKeysCollection<ActionType>): Array<ActionType | null> {
			return (keys ?? []).map((actionKey) =>
				this._findItem(actionKey as string, namespace)
			);
		}

		public addActions({
			namespace = undefined,
			keys,
		}: TActionKeysCollection<ActionType>): ActionType[] {
			return (keys || []).map((k) =>
				this._addItemKey(k as string, namespace)
			);
		}
	};
