package interfaces;

import misc.AutomataEventEmitter;
import misc.AutomataEventListener;

import java.util.List;

import types.automata.*;
import types.automata.AutomataTypes.*;
import types.automata.AutomataTypes.TAutomataEventMeta;

public interface AutomataInterfaces extends AutomataValidators {

    interface IAutomataEventAdapter <
            State extends TAutomataBaseStateType,
            Action extends TAutomataBaseActionType,
            Event extends TAutomataBaseEventType,
            Context extends TAutomataContextType,
            Payload extends TAutomataPayloadType,
            EventMeta extends TAutomataEventMetaType
            > extends IAutomataValidatorContainer<State, Action, Event>
    {
        void addEventListener(AutomataEventListener<Event, Action, Payload, EventMeta> listener);
        void addEventEmitter(AutomataEventEmitter<Event, State, EventMeta, Context> emitter);
        List<TAutomataActionPayload<Action, Payload>> handleEvent(TAutomataEventMeta<Event, EventMeta> event); // ?
    }

    interface IStateDictionary<
            State extends TAutomataBaseStateType,
            Context extends TAutomataContextType
            > extends IAutomataExtendedStateContainer<State, Context>
    {
        // todo
    }

    interface IActionDictionary<
            Action extends TAutomataBaseActionType,
            Payload extends TAutomataPayloadType
            > extends IAutomataExtendedActionContainer<Action, Payload>
    {
        // todo
    }

    interface IEventDictionary<
            Event extends TAutomataBaseEventType,
            EventMeta extends TAutomataEventMetaType
            > extends IAutomataExtendedEventContainer<Event, EventMeta>
    {
        // todo
    }

    interface IAutomataSlice<
            Event extends TAutomataBaseEventType,
            EventMeta extends TAutomataEventMetaType,
            Model
            > extends IAutomataEventContainer<Event>
    {
        // todo
    }

    interface IAutomataEventBus<
            Event extends TAutomataBaseEventType,
            EventMeta extends TAutomataEventMetaType
            > extends IAutomataExtendedEventContainer<Event, EventMeta>
    {
        // todo
    }


}
