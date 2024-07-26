package types.automata;

import java.util.HashMap;
import java.util.Map;

public class TAutomataEventMetaType extends HashMap<String, Object> {
    protected TAutomataEventMetaType() {}
    protected TAutomataEventMetaType(Entry<String, Object>... entries) {
        super(Map.ofEntries(entries));
    }
    protected TAutomataEventMetaType(Map<String, Object> map) { super(map); }
}
