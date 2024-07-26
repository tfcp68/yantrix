package misc;

import types.automata.TAutomataBaseEventType;
import types.automata.TAutomataBaseStateType;
import types.automata.TAutomataContextType;
import types.automata.TAutomataEventMetaType;
import types.automata.AutomataTypes;

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
