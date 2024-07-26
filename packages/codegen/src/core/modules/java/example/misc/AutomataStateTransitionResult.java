package org.example.misc;

import org.example.types.automata.TAutomataBaseStateType;
import org.example.types.automata.TAutomataContextType;

import java.util.function.Function;

public record AutomataStateTransitionResult (
        TAutomataBaseStateType newState,
        Function<AutomataPayloadContext, TAutomataContextType> getNewContext
) {
}
