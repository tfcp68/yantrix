package org.example.types;

import org.example.types.automata.TAutomataPayloadType;

import java.util.Map;

public class TAutomataBasePayload extends TAutomataPayloadType {
    public TAutomataBasePayload() { super(); }
    public TAutomataBasePayload(Entry<String, Object>... entries) { super(entries); }
    public TAutomataBasePayload(Map<String, Object> map) { super(map); }

    private TAutomataBasePayload(TAutomataPayloadType payload) {
        super();
        this.putAll(payload);
    }
}
