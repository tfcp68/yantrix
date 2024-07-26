package types.automata;

import java.util.HashMap;

public class AutomataDictionaries {

    static class TStateDictionaryMapping<State extends TAutomataBaseStateType> extends HashMap<String, State> {}
    static class TActionDictionaryMapping<Action extends TAutomataBaseActionType> extends HashMap<String, Action> {}
    static class TEventDictionaryMapping<Event extends TAutomataBaseEventType> extends HashMap<String, Event> {}

    static class TStateKeysCollection<State extends TAutomataBaseStateType> {
        String[] keys;
        String namespace;
    }
    static class TStateValuesCollection<State extends TAutomataBaseStateType> {
        State[] states;
        String namespace;
    }
    static class TStateLookupParams<State extends TAutomataBaseStateType> {
        TStateKeysCollection<State> keysCollection;
        TStateValuesCollection<State> valuesCollection;
    }

    static class TActionKeysCollection<Action extends TAutomataBaseActionType> {
        String[] keys;
        String namespace;
    }
    static class TActionValuesCollection<Action extends TAutomataBaseActionType> {
        Action[] states;
        String namespace;
    }
    static class TActionLookupParams<Action extends TAutomataBaseActionType> {
        TActionKeysCollection<Action> keysCollection;
        TActionValuesCollection<Action> valuesCollection;
    }

    static class TEventKeysCollection<Event extends TAutomataBaseEventType> {
        String[] keys;
        String namespace;
    }
    static class TEventValuesCollection<Event extends TAutomataBaseEventType> {
        Event[] states;
        String namespace;
    }
    static class TEventLookupParams<Event extends TAutomataBaseEventType> {
        TEventKeysCollection<Event> keysCollection;
        TEventValuesCollection<Event> valuesCollection;
    }

}
