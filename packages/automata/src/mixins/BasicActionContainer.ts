import { isPositiveInteger } from '@yantrix/utils';
import {
	TAbstractConstructor,
	TAutomataBaseActionType,
	TValidator,
} from '../types/index.js';
import { IAutomataActionContainer } from '../types/interfaces.js';

export function BasicActionContainer<
	ActionType extends TAutomataBaseActionType
>() {
	return <T extends TAbstractConstructor>(
		Base: T
	): TAbstractConstructor<IAutomataActionContainer<ActionType>> =>
		class AbstractBasicActionContainer extends Base {
			#defaultActionValidator =
				isPositiveInteger as TValidator<ActionType>;

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
					throw new Error(
						`passed Action Validator is not a function`
					);
				this.#actionValidator = actionValidator.bind(this);
				return this;
			}
		};
}

export default BasicActionContainer;
