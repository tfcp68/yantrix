import { AbstractBaseClass } from './mixins/BaseClass.js';
import DictionaryContainer from './mixins/DictionaryContainer.js';
import ExtendedActionContainer from './mixins/ExtendedActionContainer.js';
import { TActionKeysCollection, TActionLookupParams, TActionValuesCollection } from './types/dictionaries.js';
import { TAbstractConstructor, TAutomataBaseActionType } from './types/index.js';
import { IActionDictionary } from './types/interfaces.js';

export function createActionDictionary<
	ActionType extends TAutomataBaseActionType,
	PayloadType extends { [K in ActionType]: any },
>() {
	return <BaseType extends TAbstractConstructor = TAbstractConstructor>(Base: BaseType) =>
		class AbstractActionDictionary extends DictionaryContainer<ActionType>()(
			ExtendedActionContainer<ActionType, PayloadType>()(Base),
		) {
			getActionKeys({
				actions = [],
				namespace = undefined,
			}: TActionValuesCollection<ActionType>): Array<string | null> {
				return (actions ?? []).map((action) => {
					if (!this.validateAction(action)) return null;
					const data = this._getValueData(action);
					if (!data) return null;
					if (namespace !== null && namespace !== data.namespace) return null;
					return data.key;
				});
			}

			clearActions(namespace?: string) {
				return this._clearItems(namespace);
			}

			removeActions({ namespace, actions = [], keys = [] }: TActionLookupParams<ActionType>) {
				const actionsToDelete: ActionType[] = [
					...actions.filter(this.validateAction),
					...keys.flatMap((k) => (k ? [this._findItem(k, namespace)] : [])),
				].filter((v) => v !== null);

				const actionKeys = actionsToDelete
					.map((action) => this._getValueData(action))
					.filter((data) => !!data && (namespace === null || namespace === data?.namespace));

				for (const actionKey of actionKeys) if (actionKey) this._deleteItemKey(actionKey.key);

				return this;
			}

			getActionValues({
				namespace = undefined,
				keys = [],
			}: TActionKeysCollection<ActionType>): Array<ActionType | null> {
				return (keys ?? []).flatMap((k) => (k ? [this._findItem(k, namespace)] : []));
			}

			addActions({ namespace = undefined, keys }: TActionKeysCollection<ActionType>): ActionType[] {
				return (keys || []).flatMap((k) => (k ? [this._addItemKey(k, namespace)] : []));
			}
		};
}

export class BasicActionDictionary
	extends createActionDictionary<TAutomataBaseActionType, Record<TAutomataBaseActionType, any>>()(AbstractBaseClass)
	implements IActionDictionary<TAutomataBaseActionType, Record<TAutomataBaseActionType, any>>
{
	constructor() {
		super();
	}
}

export default BasicActionDictionary;
