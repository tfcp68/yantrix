package org.example.types;

import org.example.types.automata.TAutomataContextType;
import org.example.types.automata.TAutomataPayloadType;

public class TAutomataBaseContext extends TAutomataContextType {
    public TAutomataBaseContext() { super(); }
    private TAutomataBaseContext(TAutomataPayloadType payload) {
        super();
        payload.forEach((key, value) -> this.put(TAutomataBaseState.of(key.getValue()), value));
    }

    public static TAutomataBaseContext fromPayload(TAutomataPayloadType payload) {
        return new TAutomataBaseContext(payload);
    }
}
