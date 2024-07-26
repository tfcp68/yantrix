package misc;

import types.automata.TAutomataBaseStateType;
import types.automata.TAutomataContextType;

import java.util.function.Function;

public record AutomataStateTransitionResult (
        TAutomataBaseStateType newState,
        Function<AutomataPayloadContext, TAutomataContextType> getNewContext
) {
}
