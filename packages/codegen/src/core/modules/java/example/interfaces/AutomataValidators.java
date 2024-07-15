package org.example.interfaces;

import org.example.types.automata.*;
import org.example.types.automata.AutomataTypes.*;

public interface AutomataValidators {

    interface IAutomataEventContainer<Event extends TAutomataBaseEventType>
    {
        TValidator<Event> validateEvent();
        void setEventValidator(TValidator<Event> eventValidator);
    }

    interface IAutomataStateContainer<State extends TAutomataBaseStateType>
    {
        TValidator<State> validateState();
        void setStateValidator(TValidator<State> eventValidator);
    }

    interface IAutomataActionContainer<Action extends TAutomataBaseActionType>
    {
        TValidator<Action> validateAction();
        void setActionValidator(TValidator<Action> eventValidator);
    }

    interface IAutomataValidatorContainer <
            State extends TAutomataBaseStateType,
            Action extends TAutomataBaseActionType,
            Event extends TAutomataBaseEventType
            >
            extends
            IAutomataStateContainer<State>,
            IAutomataActionContainer<Action>,
            IAutomataEventContainer<Event>
    {

    }

    interface IAutomataExtendedStateContainer <
            State extends TAutomataBaseStateType,
            Context extends TAutomataContextType
            > extends IAutomataStateContainer<State>
    {
        TValidator<TAutomataStateContext<State, Context>> validateContext();
        void setContextValidator(TValidator<TAutomataStateContext<State, Context>> validator);
    }

    interface IAutomataExtendedActionContainer <
            Action extends TAutomataBaseActionType,
            Payload extends TAutomataPayloadType
            > extends IAutomataActionContainer<Action>
    {
        TValidator<TAutomataActionPayload<Action, Payload>> validatePayload();
        void setPayloadValidator(TValidator<TAutomataActionPayload<Action, Payload>> validator);
    }

    interface IAutomataExtendedEventContainer <
            Event extends TAutomataBaseEventType,
            EventMeta extends TAutomataEventMetaType
            > extends IAutomataEventContainer<Event>
    {
        TValidator<TAutomataEventMeta<Event, EventMeta>> validateMeta();
        void setMetaValidator(TValidator<TAutomataEventMeta<Event, EventMeta>> validator);
    }

    interface IAutomataExtendedValidatorContainer<
            State extends TAutomataBaseStateType,
            Action extends TAutomataBaseActionType,
            Event extends TAutomataBaseEventType,
            Context extends TAutomataContextType,
            Payload extends TAutomataPayloadType,
            EventMeta extends TAutomataEventMetaType
            >
            extends
            IAutomataValidatorContainer<State, Action, Event>,
            IAutomataExtendedStateContainer<State, Context>,
            IAutomataExtendedActionContainer<Action, Payload>,
            IAutomataExtendedEventContainer<Event, EventMeta>
    {

    }
}
