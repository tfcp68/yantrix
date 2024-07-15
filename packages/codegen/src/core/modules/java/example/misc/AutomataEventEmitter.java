package org.example.misc;

import org.example.types.automata.TAutomataBaseEventType;
import org.example.types.automata.TAutomataBaseStateType;
import org.example.types.automata.TAutomataContextType;
import org.example.types.automata.TAutomataEventMetaType;
import org.example.types.automata.AutomataTypes;

public record AutomataEventEmitter<
        Event extends TAutomataBaseEventType,
        State extends TAutomataBaseStateType,
        EventMeta extends TAutomataEventMetaType,
        Context extends TAutomataContextType
        >
    (
        State on,
        AutomataTypes.TAutomataEventEmitter<Event, State, EventMeta, Context> emitter
    )
{

}
