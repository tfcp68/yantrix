import { isPositiveInteger } from '@yantrix/utils';
import {
	TAbstractConstructor,
	TAutomataBaseActionType,
	TMixin,
	TValidator,
} from '../types/index.js';
import { IAutomataActionContainer } from '../types/interfaces.js';
import { AbstractBaseClass } from './BaseClass.js';

export const BasicActionContainer = <
	ActionType extends TAutomataBaseActionType,
	T extends TAbstractConstructor
>(
	Base: T
) =>
	class BasicActionContainer
		extends Base
		implements IAutomataActionContainer<ActionType>
	{
		#defaultActionValidator = isPositiveInteger as TValidator<ActionType>;

		#actionValidator?: TValidator<ActionType>;

		get validateAction() {
			return this.#actionValidator ?? this.#defaultActionValidator;
		}

		setActionValidator(
			actionValidator: TValidator<ActionType> | null = null
		) {
			if (actionValidator === null) {
				this.#actionValidator = undefined;
				return this;
			}
			if (typeof actionValidator !== 'function')
				throw new Error(`passed Action Validator is not a function`);
			this.#actionValidator = actionValidator.bind(this);
			return this;
		}
	};

// eslint-disable-next-line no-redeclare
export interface BasicActionContainer
	extends TMixin<typeof BasicActionContainer> {}

export const BasicActionContainerFactory = <
	ActionType extends TAutomataBaseActionType
>(
	base: typeof AbstractBaseClass = AbstractBaseClass
): TAbstractConstructor<BasicActionContainer> =>
	BasicActionContainer<ActionType, typeof base>(base);

export class GenericBasicActionContainer extends BasicActionContainerFactory() {}

export default BasicActionContainer;
