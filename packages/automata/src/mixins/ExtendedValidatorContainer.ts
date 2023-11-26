import {
	TAbstractConstructor,
	TAutomataBaseActionType,
	TAutomataBaseEventType,
	TAutomataBaseStateType,
} from '../types/index.js';
import ExtendedActionContainer from './ExtendedActionContainer.js';
import ExtendedEventContainer from './ExtendedEventContainer.js';
import ExtendedStateContainer from './ExtendedStateContainer.js';

export default function ExtendedValidatorContainer<
	StateType extends TAutomataBaseStateType,
	ActionType extends TAutomataBaseActionType,
	EventType extends TAutomataBaseEventType,
	ContextType extends { [K in StateType]: any },
	PayloadType extends { [K in ActionType]: any },
	EventMetaType extends { [K in EventType]: any },
>() {
	return <TBase extends TAbstractConstructor>(Proto: TBase) =>
		class AbstractExtendedValidatorContainer extends ExtendedStateContainer<
			StateType,
			ContextType
		>()(
			ExtendedEventContainer<EventType, EventMetaType>()(
				ExtendedActionContainer<ActionType, PayloadType>()(Proto),
			),
		) {};
}
