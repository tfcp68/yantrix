import { isPositiveInteger } from '@yantrix/utils';
import {
	TAutomataBaseEventType,
	TAutomataEventMetaType,
	TValidator,
} from '../types/index.js';
import {
	IAutomataEventContainer,
	IAutomataExtendedEventContainer,
} from '../types/interfaces.js';

export abstract class AutomataEventContainer<
	EventType extends TAutomataBaseEventType
> implements IAutomataEventContainer<EventType>
{
	protected __defaultEventValidator =
		isPositiveInteger as TValidator<EventType>;

	protected __eventValidator?: TValidator<EventType>;

	public get validateEvent() {
		return this.__eventValidator ?? this.__defaultEventValidator;
	}

	setEventValidator(eventValidator: TValidator<EventType> | null = null) {
		if (eventValidator === null) {
			this.__eventValidator = undefined;
			return this;
		}
		if (typeof eventValidator !== 'function')
			throw new Error(`passed Event Validator is not a function`);
		this.__eventValidator = eventValidator.bind(this);
		return this;
	}
}

export abstract class AutomataExtendedEventContainer<
		EventType extends TAutomataBaseEventType,
		EventMetaType extends { [K in EventType]: any }
	>
	extends AutomataEventContainer<EventType>
	implements IAutomataExtendedEventContainer<EventType, EventMetaType>
{
	protected __eventMetaValidator?: TValidator<
		TAutomataEventMetaType<EventType, EventMetaType>
	>;

	public get validateEventMeta() {
		return this.__eventMetaValidator ?? this.__defaultEventMetaValidator;
	}

	setEventMetaValidator(
		eventMetaValidator?: TValidator<
			TAutomataEventMetaType<EventType, EventMetaType>
		>
	): this {
		if (eventMetaValidator === null) {
			this.__eventMetaValidator = undefined;
			return this;
		}
		if (typeof eventMetaValidator !== 'function')
			throw new Error(`passed Event Meta Validator is not a function`);
		this.__eventMetaValidator = eventMetaValidator.bind(this);
		return this;
	}

	protected __defaultEventMetaValidator = (
		p: any
	): p is TAutomataEventMetaType<EventType, EventMetaType> =>
		this.validateEvent(p?.event) &&
		p?.meta != null &&
		typeof p.meta === 'object';
}
