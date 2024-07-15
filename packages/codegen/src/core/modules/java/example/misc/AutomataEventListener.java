package org.example.misc;

import org.example.types.automata.TAutomataBaseActionType;
import org.example.types.automata.TAutomataBaseEventType;
import org.example.types.automata.TAutomataEventMetaType;
import org.example.types.automata.TAutomataPayloadType;
import org.example.types.automata.AutomataTypes;

public record AutomataEventListener<
        Event extends TAutomataBaseEventType,
        Action extends TAutomataBaseActionType,
        Payload extends TAutomataPayloadType,
        EventMeta extends TAutomataEventMetaType
        >
    (
        Event type,
        AutomataTypes.TAutomataEventHandler<Event, Action, EventMeta, Payload> handler
    )
{

}
