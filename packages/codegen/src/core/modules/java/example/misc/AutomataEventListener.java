package misc;

import types.automata.TAutomataBaseActionType;
import types.automata.TAutomataBaseEventType;
import types.automata.TAutomataEventMetaType;
import types.automata.TAutomataPayloadType;
import types.automata.AutomataTypes;

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
