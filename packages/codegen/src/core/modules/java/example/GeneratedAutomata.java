package org.example;

import org.example.exceptions.InvalidStateException;
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

    public static final Map<String, TAutomataBaseStateType> statesDictionary = Map.of(
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

    public static final Map<String, TAutomataBaseActionType> actionsDictionary = Map.of(
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

    public final Map<TAutomataBaseStateType, Map<TAutomataBaseActionType, AutomataStateTransitionResult>> stateTransitionMatrix =
        Map.ofEntries(
            Map.entry(TAutomataBaseState.of(1696941163L), Map.of(
                    TAutomataBaseAction.of(1423436384L),
                    new AutomataStateTransitionResult(
                            TAutomataBaseState.of(45657535L),
                            this::getDefaultContext
                    )
            )),
            Map.entry(TAutomataBaseState.of(45657535L), Map.of(
                    TAutomataBaseAction.of(1481692L),
                    new AutomataStateTransitionResult(
                            TAutomataBaseState.of(1415394173L),
                            this::getDefaultContext
                    )
            )),
            Map.entry(TAutomataBaseState.of(1415394173L), Map.of(
                    TAutomataBaseAction.of(99594860L),
                    new AutomataStateTransitionResult(
                            TAutomataBaseState.of(1918712022L),
                            this::getDefaultContext
                    )
            )),
            Map.entry(TAutomataBaseState.of(1918712022L), Map.of(
                    TAutomataBaseAction.of(45547981L),
                    new AutomataStateTransitionResult(
                            TAutomataBaseState.of(2004485394L),
                            this::getDefaultContext
                    ),
                    TAutomataBaseAction.of(1546956885L),
                    new AutomataStateTransitionResult(
                            TAutomataBaseState.of(1918712022L),
                            this::getDefaultContext
                    ),
                    TAutomataBaseAction.of(834502202L),
                    new AutomataStateTransitionResult(
                            TAutomataBaseState.of(487317864L),
                            this::getDefaultContext
                    ),
                    TAutomataBaseAction.of(1675466392L),
                    new AutomataStateTransitionResult(
                            TAutomataBaseState.of(487317864L),
                            this::getDefaultContext
                    )
            )),
            Map.entry(TAutomataBaseState.of(487317864L), Map.of(
                    TAutomataBaseAction.of(45547981L),
                    new AutomataStateTransitionResult(
                            TAutomataBaseState.of(2004485394L),
                            this::getDefaultContext
                    ),
                    TAutomataBaseAction.of(99594860L),
                    new AutomataStateTransitionResult(
                            TAutomataBaseState.of(1918712022L),
                            this::getDefaultContext
                    ),
                    TAutomataBaseAction.of(383736638L),
                    new AutomataStateTransitionResult(
                            TAutomataBaseState.of(1253633506L),
                            this::getDefaultContext
                    )
            )),
            Map.entry(TAutomataBaseState.of(1253633506L), Map.of(
                    TAutomataBaseAction.of(1225901225L),
                    new AutomataStateTransitionResult(
                            TAutomataBaseState.of(1301012547L),
                            this::getDefaultContext
                    )
            )),
            Map.entry(TAutomataBaseState.of(1301012547L), Map.of(
                    TAutomataBaseAction.of(45547981L),
                    new AutomataStateTransitionResult(
                            TAutomataBaseState.of(2004485394L),
                            this::getDefaultContext
                    ),
                    TAutomataBaseAction.of(808645083L),
                    new AutomataStateTransitionResult(
                            TAutomataBaseState.of(1404098696L),
                            this::getDefaultContext
                    ),
                    TAutomataBaseAction.of(99594860L),
                    new AutomataStateTransitionResult(
                            TAutomataBaseState.of(1918712022L),
                            this::getDefaultContext
                    )
            )),
            Map.entry(TAutomataBaseState.of(1404098696L), Map.of(
                    TAutomataBaseAction.of(99594860L),
                    new AutomataStateTransitionResult(
                            TAutomataBaseState.of(1918712022L),
                            this::getDefaultContext
                    ),
                    TAutomataBaseAction.of(45547981L),
                    new AutomataStateTransitionResult(
                            TAutomataBaseState.of(2004485394L),
                            this::getDefaultContext
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
        IAutomataReducer<TAutomataBaseStateType, TAutomataBaseActionType, TAutomataContextType, TAutomataPayloadType> rootReducer = (obj) -> {
            if(obj.action == null || obj.payload == null) {
                return TAutomataStateContext.of(obj.state, obj.context);
            }
            if(!stateTransitionMatrix.containsKey(obj.state)) {
                throw new InvalidStateException("Invalid state, maybe machine isn't running");
            }
            if(!stateTransitionMatrix.get(obj.state).containsKey(obj.action)) {
                return TAutomataStateContext.of(
                        obj.state,
                        obj.context
                );
            }
            AutomataStateTransitionResult res = stateTransitionMatrix.get(obj.state).get(obj.action);
            return TAutomataStateContext.of(
                    res.newState(),
                    res.getNewContext().apply(new AutomataPayloadContext(obj.payload, obj.context))
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

    public Map getStateTransitionMatrix() { return this.stateTransitionMatrix; }

    @Override
    public String toString() {
        return "GeneratedAutomata{" +
                "statesDictionary=" + statesDictionary +
                ", actionsDictionary=" + actionsDictionary +
                ", stateTransitionMatrix=" + stateTransitionMatrix +
                '}';
    }
}
