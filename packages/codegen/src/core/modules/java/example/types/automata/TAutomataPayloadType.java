package types.automata;

import java.util.HashMap;
import java.util.Map;

public class TAutomataPayloadType extends HashMap<String, Object> {
    protected TAutomataPayloadType() {}
    protected TAutomataPayloadType(Entry<String, Object>... entries) {
        super(Map.ofEntries(entries));
    }
    protected TAutomataPayloadType(Map<String, Object> map) { super(map); }
}
