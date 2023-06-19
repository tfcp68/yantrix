import { isPositiveInteger } from '@yantrix/utils';
import {
	TAutomataBaseStateType,
	TAutomataStateContext,
	TValidator,
} from '../types/index.js';
import {
	IAutomataExtendedStateContainer,
	IAutomataStateContainer,
} from '../types/interfaces.js';

export abstract class AutomataStateContainer<
	StateType extends TAutomataBaseStateType
> implements IAutomataStateContainer<StateType>
{
	protected __defaultStateValidator =
		isPositiveInteger as TValidator<StateType>;

	protected __stateValidator?: TValidator<StateType>;

	public get validateState() {
		return this.__stateValidator ?? this.__defaultStateValidator;
	}

	setStateValidator(stateValidator: TValidator<StateType> | null = null) {
		if (stateValidator === null) {
			this.__stateValidator = undefined;
			return this;
		}
		if (typeof stateValidator !== 'function')
			throw new Error(`passed State Validator is not a function`);
		this.__stateValidator = stateValidator.bind(this);
		return this;
	}
}

export abstract class AutomataExtendedStateContainer<
		StateType extends TAutomataBaseStateType,
		ContextType extends { [K in StateType]: any }
	>
	extends AutomataStateContainer<StateType>
	implements IAutomataExtendedStateContainer<StateType, ContextType>
{
	protected __contextValidator?: TValidator<
		TAutomataStateContext<StateType, ContextType>
	>;

	public get validateContext() {
		return this.__contextValidator ?? this.__defaultContextValidator;
	}

	setContextValidator(
		contextValidator?: TValidator<
			TAutomataStateContext<StateType, ContextType>
		>
	): this {
		if (contextValidator === null) {
			this.__contextValidator = undefined;
			return this;
		}
		if (typeof contextValidator !== 'function')
			throw new Error(`passed Context Validator is not a function`);
		this.__contextValidator = contextValidator.bind(this);
		return this;
	}

	protected __defaultContextValidator = (
		p: any
	): p is TAutomataStateContext<StateType, ContextType> =>
		this.validateState(p?.state) &&
		p?.context != null &&
		typeof p.context === 'object';
}
