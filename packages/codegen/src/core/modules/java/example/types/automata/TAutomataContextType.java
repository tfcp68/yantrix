package types.automata;

import java.util.HashMap;
import java.util.Map;

public abstract class TAutomataContextType extends HashMap<String, Object> {
    protected TAutomataContextType() {}
    protected TAutomataContextType(Entry<String, Object>... entries) {
        super(Map.ofEntries(entries));
    }
    protected TAutomataContextType(Map<String, Object> map) { super(map); }
}
