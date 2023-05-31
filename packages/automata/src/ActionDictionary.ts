import {
	TAutomataActionPayload,
	TAutomataBaseActionType,
	TValidator,
} from './types/index.js';
import {
	TActionKeysCollection,
	TActionLookupParams,
	TActionValuesCollection,
} from './types/dictionaries.js';
import { IActionDictionary } from './types/interfaces.js';
import AbstractDictionaryContainer from './DictionaryContainer.js';
import { isPositiveInteger } from '@yantrix/utils';

export default abstract class GenericActionDictionary<
		ActionType extends TAutomataBaseActionType,
		PayloadType extends { [K in ActionType]: any }
	>
	extends AbstractDictionaryContainer<ActionType>
	implements IActionDictionary<ActionType, PayloadType>
{
	protected _actionValidator?: TValidator<ActionType>;
	protected _payloadValidator?: TValidator<
		TAutomataActionPayload<ActionType, PayloadType>
	>;
	protected defaultActionValidator =
		isPositiveInteger as TValidator<ActionType>;
	protected defaultPayloadValidator = ((actionPayload) =>
		this.validateAction(actionPayload?.action) &&
		typeof actionPayload?.payload === 'object') as TValidator<
		TAutomataActionPayload<ActionType, PayloadType>
	>;

	public get validateAction() {
		return this._actionValidator ?? this.defaultActionValidator;
	}

	public get validateActionPayload() {
		return this._payloadValidator ?? this.defaultPayloadValidator;
	}

	public setActionValidator(
		actionValidator: TValidator<ActionType> | null = null
	) {
		if (actionValidator === null) {
			this._actionValidator = undefined;
			return this;
		}
		if (typeof actionValidator !== 'function')
			throw new Error(`passed Action Validator is not a function`);
		this._actionValidator = actionValidator;
		return this;
	}

	public setActionPayloadValidator(
		actionPayloadValidator: TValidator<
			TAutomataActionPayload<ActionType, PayloadType>
		> | null = null
	) {
		if (actionPayloadValidator === null) {
			this._payloadValidator = undefined;
			return this;
		}
		if (typeof actionPayloadValidator !== 'function')
			throw new Error(
				`passed Action Payload Validator is not a function`
			);
		this._payloadValidator = actionPayloadValidator;
		return this;
	}

	public getActionKeys({
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
}
