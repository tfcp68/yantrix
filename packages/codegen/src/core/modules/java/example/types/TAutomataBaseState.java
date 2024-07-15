package org.example.types;

import org.example.types.automata.TAutomataBaseStateType;

public class TAutomataBaseState extends TAutomataBaseStateType {

    private TAutomataBaseState() {}
    private TAutomataBaseState(Long value) { this.value = value; }

    public static TAutomataBaseState of(Long value) { return new TAutomataBaseState(value); }

}
