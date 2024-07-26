package org.example.misc;

import org.example.types.automata.TAutomataContextType;
import org.example.types.automata.TAutomataPayloadType;

public record AutomataPayloadContext(
        TAutomataPayloadType payload,
        TAutomataContextType context
) {
}
