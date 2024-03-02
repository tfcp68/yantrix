import {
	TAbstractConstructor,
	TAutomataBaseActionType,
	TAutomataBaseEventType,
	TAutomataBaseStateType,
} from '../types/index.js';
import BasicActionContainer from './BasicActionContainer.js';
import BasicEventContainer from './BasicEventContainer.js';
import BasicStateContainer from './BasicStateContainer.js';

export default function BasicValidatorContainer<
	StateType extends TAutomataBaseStateType,
	ActionType extends TAutomataBaseActionType,
	EventType extends TAutomataBaseEventType,
>() {
	return <TBase extends TAbstractConstructor>(Proto: TBase) =>
		class AbstractBasicValidatorContainer extends BasicStateContainer<StateType>()(
			BasicEventContainer<EventType>()(
				BasicActionContainer<ActionType>()(Proto),
			),
		) {};
}
