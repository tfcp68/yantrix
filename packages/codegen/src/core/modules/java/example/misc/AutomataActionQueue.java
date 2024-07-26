package misc;

import types.automata.TAutomataBaseActionType;
import types.automata.TAutomataBaseStateType;
import types.automata.TAutomataContextType;
import types.automata.TAutomataPayloadType;
import types.automata.AutomataTypes;

public record AutomataActionQueue <
        State extends TAutomataBaseStateType,
        Action extends TAutomataBaseActionType,
        Context extends TAutomataContextType,
        Payload extends TAutomataPayloadType
        >
    (
        AutomataTypes.TAutomataActionPayload<Action, Payload> actions,
        AutomataTypes.TAutomataStateContext<State, Context> newState
    )
{

}