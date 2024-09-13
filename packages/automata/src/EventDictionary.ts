import { TAutomataBaseEventType } from './index.js';
import { AbstractBaseClass } from './mixins/BaseClass.js';
import DictionaryContainer from './mixins/DictionaryContainer.js';
import ExtendedEventContainer from './mixins/ExtendedEventContainer.js';
import { TEventKeysCollection, TEventLookupParams, TEventValuesCollection } from './types/dictionaries.js';
import { TAbstractConstructor } from './types/index.js';
import { IEventDictionary } from './types/interfaces.js';

export function createEventDictionary<
	EventType extends TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any },
>() {
	return <BaseType extends TAbstractConstructor = TAbstractConstructor>(Base: BaseType) =>
		class AbstractEventDictionary extends DictionaryContainer<EventType>()(
			ExtendedEventContainer<EventType, EventMetaType>()(Base),
		) {
			/**
			 * Retrieves event keys bound to the namespace
			 * @param obj - object with list of events to get keys for and associated namespace
			 * @param obj.events - list of events to get keys for
			 * @param obj.namespace - associated namespace
			 * @returns Array of event keys
			 */
			getEventKeys({
				events = [],
				namespace = undefined,
			}: TEventValuesCollection<EventType>): Array<string | null> {
				return (events ?? []).map((event) => {
					if (!this.validateEvent(event))
						return null;
					const data = this._getValueData(event);
					if (!data)
						return null;
					if (namespace !== null && namespace !== data.namespace)
						return null;
					return data?.key;
				});
			}

			/**
			 * Clears all events bound to the namespace
			 * @param namespace
			 * @returns dictionary
			 */
			clearEvents(namespace?: string): this {
				return this._clearItems(namespace);
			}

			/**
			 * Removes specified events from the dictionary
			 * @param obj - object with namespace, list of events/keys to delete
			 * @returns dictionary
			 */
			removeEvents({ namespace, events = [], keys = [] }: TEventLookupParams<EventType>): this {
				const eventsToDelete = [
					...events.filter(this.validateEvent),
					...keys.flatMap(k => (k ? [this._findItem(k, namespace)] : [])),
				].filter(v => v !== null);
				const eventKeys = eventsToDelete
					.map(event => this._getValueData(event))
					.filter(data => !!data && (namespace == null || namespace === data?.namespace));
				for (const eventKey of eventKeys) {
					if (eventKey)
						this._deleteItemKey(eventKey.key);
				}
				return this;
			}

			/**
			 * Retrieves event values bound to the namespace
			 * @param obj - object with list of keys to get events from and associated namespace
			 * @returns Array of event values
			 */
			getEventValues({
				namespace = undefined,
				keys = [],
			}: TEventKeysCollection<EventType>): Array<EventType | null> {
				return (keys ?? []).flatMap(k => (k ? [this._findItem(k, namespace)] : []));
			}

			/**
			 * Add events to the namespace
			 * @param obj - object with list of keys to get events from and associated namespace
			 * @returns Array of added events
			 */
			addEvents({ namespace = undefined, keys }: TEventKeysCollection<EventType>): EventType[] {
				return (keys || []).flatMap(k => (k ? [this._addItemKey(k, namespace)] : []));
			}
		};
}

export class BasicEventDictionary
	extends createEventDictionary<TAutomataBaseEventType, Record<TAutomataBaseEventType, any>>()(AbstractBaseClass)
	implements IEventDictionary<TAutomataBaseEventType, Record<TAutomataBaseEventType, any>> {
	constructor() {
		super();
	}
}

export default BasicEventDictionary;
