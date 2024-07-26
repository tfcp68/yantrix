package misc;

import types.automata.TAutomataContextType;
import types.automata.TAutomataPayloadType;

public record AutomataPayloadContext(
        TAutomataPayloadType payload,
        TAutomataContextType context
) {
}
