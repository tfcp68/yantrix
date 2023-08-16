import { isPositiveInteger } from '@yantrix/utils';
import {
	TAbstractConstructor,
	TAutomataBaseEventType,
	TValidator,
} from '../types/index.js';

export default function BasicEventContainer<
	EventType extends TAutomataBaseEventType
>() {
	return <T extends TAbstractConstructor>(Base: T) =>
		class AbstractBasicEventContainer extends Base {
			#_defaultEventValidator =
				isPositiveInteger as TValidator<EventType>;
			#_eventValidator?: TValidator<EventType>;

			constructor(...args: any[]) {
				super(args);
			}

			public get validateEvent() {
				return this.#_eventValidator ?? this.#_defaultEventValidator;
			}

			setEventValidator(
				eventValidator: TValidator<EventType> | null = null
			) {
				if (eventValidator === null) {
					this.#_eventValidator = undefined;
					return this;
				}
				if (typeof eventValidator !== 'function')
					throw new Error(`passed Event Validator is not a function`);
				this.#_eventValidator = eventValidator.bind(this);
				return this;
			}
		};
}
