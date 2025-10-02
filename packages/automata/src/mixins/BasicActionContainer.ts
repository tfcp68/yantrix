import { isPositiveInteger } from '@yantrix/utils';
import { TAbstractConstructor, TAutomataBaseActionType, TValidator } from '../types/index.js';

export default function BasicActionContainer<ActionType extends TAutomataBaseActionType>() {
	return <T extends TAbstractConstructor>(Base: T) =>
		class AbstractBasicActionContainer extends Base {
			#_defaultActionValidator = isPositiveInteger as TValidator<ActionType>;

			#_actionValidator: TValidator<ActionType> | undefined;

			get validateAction(): TValidator<ActionType> {
				return this.#_actionValidator ?? this.#_defaultActionValidator;
			}

			setActionValidator(actionValidator: TValidator<ActionType> | null = null): this {
				if (actionValidator === null) {
					this.#_actionValidator = undefined;
					return this;
				}
				if (typeof actionValidator !== 'function')
					throw new Error(`passed Action Validator is not a function`);
				this.#_actionValidator = actionValidator.bind(this);
				return this;
			}
		};
}
