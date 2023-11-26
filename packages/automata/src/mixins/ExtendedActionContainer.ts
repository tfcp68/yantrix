import {
	TAbstractConstructor,
	TAutomataActionPayload,
	TAutomataBaseActionType,
	TValidator,
} from '../types/index.js';
import BasicActionContainer from './BasicActionContainer.js';

export default function ExtendedActionContainer<
	ActionType extends TAutomataBaseActionType,
	PayloadType extends { [K in ActionType]: any },
>() {
	return <TBase extends TAbstractConstructor>(Proto: TBase) =>
		class AbstractExtendedActionContainer extends BasicActionContainer<ActionType>()(
			Proto,
		) {
			_payloadValidator?: TValidator<
				TAutomataActionPayload<ActionType, PayloadType>
			>;

			get validateActionPayload() {
				return this._payloadValidator ?? this._defaultPayloadValidator;
			}

			setActionPayloadValidator(
				payloadValidator?: TValidator<
					TAutomataActionPayload<ActionType, PayloadType>
				>,
			): this {
				if (payloadValidator === null) {
					this._payloadValidator = undefined;
					return this;
				}
				if (typeof payloadValidator !== 'function')
					throw new Error(
						`passed Payload Validator is not a function`,
					);
				this._payloadValidator = payloadValidator.bind(this);
				return this;
			}

			_defaultPayloadValidator = (
				p: any,
			): p is TAutomataActionPayload<ActionType, PayloadType> =>
				!!this.validateAction &&
				this.validateAction(p?.action) &&
				p?.payload != null &&
				typeof p.payload === 'object';
		};
}
