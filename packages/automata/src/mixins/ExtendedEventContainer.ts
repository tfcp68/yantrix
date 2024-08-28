import {
	TAbstractConstructor,
	TAutomataBaseEventType,
	TAutomataEventMetaType,
	TDefinedValues,
	TValidator,
} from '../types/index.js';
import BasicEventContainer from './BasicEventContainer.js';

export default function ExtendedEventContainer<
	EventType extends TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any },
>() {
	return <TBase extends TAbstractConstructor>(Proto: TBase) =>
		class AbstractExtendedEventContainer extends BasicEventContainer<EventType>()(Proto) {
			#__eventMetaValidator: TValidator<TAutomataEventMetaType<EventType, EventMetaType>> | undefined;

			public get validateEventMeta(): TValidator<TAutomataEventMetaType<EventType, EventMetaType>> {
				return this.#__eventMetaValidator ?? this.#__defaultEventMetaValidator;
			}

			setEventMetaValidator(
				eventMetaValidator?: TValidator<TAutomataEventMetaType<EventType, EventMetaType>>,
			): this {
				if (eventMetaValidator === null) {
					this.#__eventMetaValidator = undefined;
					return this;
				}
				if (typeof eventMetaValidator !== 'function')
					throw new Error(`passed Event Meta Validator is not a function`);
				this.#__eventMetaValidator = eventMetaValidator.bind(this);
				return this;
			}

			#__defaultEventMetaValidator = (
				p: any,
			): p is TDefinedValues<TAutomataEventMetaType<EventType, EventMetaType>> =>
				this.validateEvent(p?.event) && (p?.meta === null || typeof p.meta === 'object');
		};
}
