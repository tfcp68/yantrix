import AutomataEventAdapter from './EventAdapter';
import {
	TAutomataBaseEventType,
	TAutomataBaseStateType,
	TAutomataEventMetaType,
	TAutomataStateContext,
} from './types';
import { IAutomataEventBus } from './types/interfaces';

/**
 * Адаптер событий автомата, который не только собирает события из переходов,
 * но и немедленно диспатчит их в EventBus.
 *
 * Важно: AutomataEventAdapter не является дженериком, поэтому этот класс
 * также работает на базовых типах Yantrix.
 */
export class EventBusAwareEventAdapter extends AutomataEventAdapter {
	constructor(
		private readonly bus: IAutomataEventBus<
			TAutomataBaseEventType,
			Record<TAutomataBaseEventType, any>
		>,
	) {
		super();
	}

	public override handleTransition<T extends TAutomataBaseStateType>(
		newState: TAutomataStateContext<T, Record<TAutomataBaseStateType, any>>,
	): Array<TAutomataEventMetaType<TAutomataBaseEventType, Record<TAutomataBaseEventType, any>>> {
		const events = super.handleTransition(newState) as Array<
			TAutomataEventMetaType<TAutomataBaseEventType, Record<TAutomataBaseEventType, any>>
		>;
		if (events?.length) {
			for (const evt of events) {
				this.bus.dispatch(evt as any);
			}
		}
		return events;
	}
}

export default EventBusAwareEventAdapter;
