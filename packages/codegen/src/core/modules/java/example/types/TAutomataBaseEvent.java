package org.example.types;

import org.example.types.automata.TAutomataBaseEventType;

public class TAutomataBaseEvent extends TAutomataBaseEventType {

    private TAutomataBaseEvent() {}
    private TAutomataBaseEvent(Long value) { this.value = value; }

    public static TAutomataBaseEvent of(Long value) { return new TAutomataBaseEvent(value); }
}
