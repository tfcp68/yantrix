import { isPositiveInteger } from '@yantrix/utils';
import { TAbstractConstructor, TAutomataBaseStateType, TValidator } from '../types/index.js';

export function BasicStateContainer<StateType extends TAutomataBaseStateType>() {
	return <T extends TAbstractConstructor>(Base: T) =>
		class AbstractBasicStateContainer extends Base {
			#_stateValidator: TValidator<StateType> | undefined;

			public get validateState(): TValidator<StateType> {
				return this.#_stateValidator ?? (isPositiveInteger as TValidator<StateType>);
			}

			setStateValidator(stateValidator: TValidator<StateType> | null = null): this {
				if (stateValidator === null) {
					this.#_stateValidator = undefined;
					return this;
				}
				if (typeof stateValidator !== 'function')
					throw new Error(`passed State Validator is not a function`);
				this.#_stateValidator = stateValidator.bind(this);
				return this;
			}
		};
}

export default BasicStateContainer;
