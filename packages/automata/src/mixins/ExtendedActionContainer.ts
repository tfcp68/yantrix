import {
	TAbstractConstructor,
	TAutomataActionPayload,
	TAutomataBaseActionType,
	TValidator,
} from '../types/index.js';
import { IAutomataExtendedActionContainer } from '../types/interfaces.js';
import { BasicActionContainer } from './BasicActionContainer.js';

export function ExtendedActionContainer<
	ActionType extends TAutomataBaseActionType,
	PayloadType extends { [K in ActionType]: any }
>() {
	return <TBase extends TAbstractConstructor>(
		Proto: TBase
	): TAbstractConstructor<
		IAutomataExtendedActionContainer<ActionType, PayloadType>
	> =>
		class AbstractExtendedActionContainer extends BasicActionContainer<ActionType>()(
			Proto
		) {
			#payloadValidator?: TValidator<
				TAutomataActionPayload<ActionType, PayloadType>
			>;

			get validateActionPayload() {
				return this.#payloadValidator ?? this.#defaultPayloadValidator;
			}

			setActionPayloadValidator(
				payloadValidator?: TValidator<
					TAutomataActionPayload<ActionType, PayloadType>
				>
			): this {
				if (payloadValidator === null) {
					this.#payloadValidator = undefined;
					return this;
				}
				if (typeof payloadValidator !== 'function')
					throw new Error(
						`passed Payload Validator is not a function`
					);
				this.#payloadValidator = payloadValidator.bind(this);
				return this;
			}

			#defaultPayloadValidator = (
				p: any
			): p is TAutomataActionPayload<ActionType, PayloadType> =>
				!!this.validateAction &&
				this.validateAction(p?.action) &&
				p?.payload != null &&
				typeof p.payload === 'object';
		};
}

export default ExtendedActionContainer;
