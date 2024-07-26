package org.example.types;

import org.example.types.automata.TAutomataContextType;
import org.example.types.automata.TAutomataPayloadType;

import java.util.Map;

public class TAutomataBaseContext extends TAutomataContextType {
    public TAutomataBaseContext() { super(); }
    public TAutomataBaseContext(Entry<String, Object>... entries) { super(entries); }
    public TAutomataBaseContext(Map<String, Object> map) { super(map); }

    private TAutomataBaseContext(TAutomataPayloadType payload) {
        super();
        this.putAll(payload);
    }

    public static TAutomataBaseContext fromPayload(TAutomataPayloadType payload) {
        return new TAutomataBaseContext(payload);
    }
}
