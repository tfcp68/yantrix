package org.example;

import org.example.misc.AutomataPayloadContext;
import org.example.misc.AutomataStateTransitionResult;
import org.example.types.TAutomataBaseAction;
import org.example.types.TAutomataBaseContext;
import org.example.types.TAutomataBaseState;
import org.example.types.automata.AutomataTypes.IAutomataReducer;
import org.example.types.automata.AutomataTypes.TAutomataParams;
import org.example.types.automata.AutomataTypes.TAutomataStateContext;
import org.example.types.automata.*;

import java.util.Map;

public final class GeneratedAutomata
        extends GenericAutomata<
        TAutomataBaseStateType, TAutomataBaseActionType, TAutomataBaseEventType,
        TAutomataContextType, TAutomataPayloadType, TAutomataEventMetaType
        > {

    private final Map<String, TAutomataBaseStateType> statesDictionary = Map.of(
            "/~~~START~~~", TAutomataBaseState.of(1696941163L),
            "/INIT", TAutomataBaseState.of(45657535L),
            "/INTRO", TAutomataBaseState.of(1415394173L),
            "/MAIN_MENU", TAutomataBaseState.of(1918712022L),
            "/~~~END~~~", TAutomataBaseState.of(2004485394L),
            "/GAME_LOBBY", TAutomataBaseState.of(487317864L),
            "/GAME_STARTING", TAutomataBaseState.of(1253633506L),
            "/IN_GAME", TAutomataBaseState.of(1301012547L),
            "/SCORE_SCREEN", TAutomataBaseState.of(1404098696L)
    );

    private final Map<String, TAutomataBaseActionType> actionsDictionary = Map.of(
            "/RESET", TAutomataBaseAction.of(1423436384L),
            "/RUN", TAutomataBaseAction.of(1481692L),
            "/TO_MENU", TAutomataBaseAction.of(99594860L),
            "/EXIT", TAutomataBaseAction.of(45547981L),
            "/MENU_HOVER", TAutomataBaseAction.of(1546956885L),
            "/CREATE_GAME", TAutomataBaseAction.of(834502202L),
            "/JOIN_GAME", TAutomataBaseAction.of(1675466392L),
            "/START_GAME", TAutomataBaseAction.of(383736638L),
            "/BEGIN_GAME", TAutomataBaseAction.of(1225901225L),
            "/END_GAME", TAutomataBaseAction.of(808645083L)
    );

    private final Map<TAutomataBaseStateType, Map<TAutomataBaseActionType, AutomataStateTransitionResult>> stateTransitionMatrix =
        Map.ofEntries(
            Map.entry(TAutomataBaseState.of(1696941163L), Map.of(
                    TAutomataBaseAction.of(826759815L),
                    new AutomataStateTransitionResult(
                            TAutomataBaseState.of(132123L),
                            (payloadContext) -> {
                                var pc = getDefaultContext(payloadContext);
                                return new TAutomataBaseContext(Map.ofEntries(
                                        Map.entry("integer", pc.get("integer")),
                                        Map.entry("string", pc.get("string")),
                                        Map.entry("array", pc.get("array")),
                                        Map.entry("a1", payloadContext.payload().get("a1")),
                                        Map.entry("a2", payloadContext.payload().get("a2")),
                                        Map.entry("a3", payloadContext.payload().get("a3"))
                                ));
                            }
                    )
            ))
        );

    private TAutomataBaseContext getDefaultContext(AutomataPayloadContext arg) {
        TAutomataBaseContext prevContext = (TAutomataBaseContext) arg.context();
        TAutomataBaseContext initialContext = new TAutomataBaseContext(Map.ofEntries(
                Map.entry("integer", prevContext.getOrDefault("integer", 3)),
                Map.entry("string", prevContext.getOrDefault("string", "str")),
                Map.entry("array", prevContext.getOrDefault("array", new Object[]{}))
        ));
        prevContext.forEach((key, value) -> initialContext.merge(key, value, (initValue, prevValue) -> prevValue));
        return initialContext;
    }

    public GeneratedAutomata() {
        super();
        TAutomataBaseStateType initialState = TAutomataBaseState.of(1696941163L);
        TAutomataContextType context = new TAutomataBaseContext(Map.ofEntries(
                Map.entry("integer", 3),
                Map.entry("string", "str"),
                Map.entry("array", new Object[]{})
        ));
        IAutomataReducer<TAutomataBaseStateType, TAutomataBaseActionType, TAutomataContextType, TAutomataPayloadType> rootReducer = (event) -> {
            if(event.action == null || event.payload == null) {
                return TAutomataStateContext.of(event.state, event.context);
            }
            if(!stateTransitionMatrix.containsKey(event.state)) {
                throw new RuntimeException("Invalid state, maybe machine isn't running");
            }
            if(!stateTransitionMatrix.get(event.state).containsKey(event.action)) {
                return TAutomataStateContext.of(
                        event.state,
                        event.context
                );
            }
            AutomataStateTransitionResult res = stateTransitionMatrix.get(event.state).get(event.action);
            return TAutomataStateContext.of(
                    res.newState(),
                    res.getNewContext().apply(new AutomataPayloadContext(event.payload, event.context))
            );
        };
        TAutomataParams<TAutomataBaseStateType, TAutomataBaseActionType, TAutomataBaseEventType,
                TAutomataContextType, TAutomataPayloadType, TAutomataEventMetaType> params =
                new TAutomataParams<>(
                        initialState,
                        context,
                        rootReducer,
                        this.getStateValidator(),
                        this.getActionValidator(),
                        this.getEventValidator()
                );
        this.init(params);
    }
}
