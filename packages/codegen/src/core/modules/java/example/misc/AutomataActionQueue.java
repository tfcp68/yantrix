package org.example.misc;

import org.example.types.automata.TAutomataBaseActionType;
import org.example.types.automata.TAutomataBaseStateType;
import org.example.types.automata.TAutomataContextType;
import org.example.types.automata.TAutomataPayloadType;
import org.example.types.automata.AutomataTypes;

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