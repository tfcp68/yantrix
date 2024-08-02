import {
	TAbstractConstructor,
	TAutomataBaseStateType,
	TAutomataStateContext,
	TDefinedValues,
	TValidator,
} from '../types/index.js';
import BasicStateContainer from './BasicStateContainer.js';

export default function ExtendedStateContainer<
	StateType extends TAutomataBaseStateType,
	ContextType extends { [K in StateType]: any },
>() {
	return <TBase extends TAbstractConstructor>(Proto: TBase) =>
		class AbstractExtendedStateContainer extends BasicStateContainer<StateType>()(Proto) {
			#__contextValidator: TValidator<TAutomataStateContext<StateType, ContextType>> | undefined;

			public get validateContext(): TValidator<TAutomataStateContext<StateType, ContextType>> {
				return this.#__contextValidator ?? this.#__defaultContextValidator;
			}

			setContextValidator(contextValidator?: TValidator<TAutomataStateContext<StateType, ContextType>>): this {
				if (contextValidator === null) {
					this.#__contextValidator = undefined;
					return this;
				}
				if (typeof contextValidator !== 'function')
					throw new Error(`passed Context Validator is not a function`);
				this.#__contextValidator = contextValidator.bind(this);
				return this;
			}

			#__defaultContextValidator = (p: any): p is TDefinedValues<TAutomataStateContext<StateType, ContextType>> =>
				this.validateState(p?.state) && (p?.context === null || typeof p.context === 'object');
		};
}
