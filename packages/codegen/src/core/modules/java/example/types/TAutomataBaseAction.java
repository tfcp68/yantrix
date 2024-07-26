package types;

import types.automata.TAutomataBaseActionType;

public class TAutomataBaseAction extends TAutomataBaseActionType {

    private TAutomataBaseAction() {}
    private TAutomataBaseAction(Long value) { this.value = value; }

    public static TAutomataBaseAction of(Long value) { return new TAutomataBaseAction(value); }

}
