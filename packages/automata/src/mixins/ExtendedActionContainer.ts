import {
	TAbstractConstructor,
	TAutomataActionPayload,
	TAutomataBaseActionType,
	TMixin,
	TValidator,
} from '../types/index.js';
import { IAutomataExtendedActionContainer } from '../types/interfaces.js';
import { AbstractBaseClass } from './BaseClass.js';
import { BasicActionContainer } from './BasicActionContainer.js';

export const ExtendedActionContainer = <
	ActionType extends TAutomataBaseActionType,
	PayloadType extends { [K in ActionType]: any },
	TBase extends TAbstractConstructor = TAbstractConstructor
>(
	Proto: TBase
) =>
	class ExtendedActionContainer
		extends BasicActionContainer<ActionType, typeof Proto>(Proto)
		implements IAutomataExtendedActionContainer<ActionType, PayloadType>
	{
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
				throw new Error(`passed Payload Validator is not a function`);
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

// eslint-disable-next-line no-redeclare
export interface ExtendedActionContainer
	extends TMixin<typeof ExtendedActionContainer> {}

export const ExtendedActionContainerFactory = <
	ActionType extends TAutomataBaseActionType,
	PayloadType extends { [K in ActionType]: any }
>(
	base: typeof AbstractBaseClass = AbstractBaseClass
): TAbstractConstructor<ExtendedActionContainer> =>
	ExtendedActionContainer<ActionType, PayloadType, typeof base>(base);

export class GenericExtendedActionContainer extends ExtendedActionContainerFactory() {}

export default ExtendedActionContainer;
