package org.example;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;

public final class GeneratedAutomata {

    public static final Map<String, TAutomataBaseState> statesDictionary = Map.of(
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

    public static final Map<String, TAutomataBaseAction> actionsDictionary = Map.of(
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

    public final Map<TAutomataBaseState, Map<TAutomataBaseAction, AutomataStateTransitionResult>> stateTransitionMatrix =
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

    private TAutomataBaseState state;
    private TAutomataBaseContext context;
    private IAutomataReducer rootReducer;

    public GeneratedAutomata() {
        this.state = TAutomataBaseState.of(1696941163L);
        this.context = new TAutomataBaseContext(Map.ofEntries(
                Map.entry("integer", 3),
                Map.entry("string", "str"),
                Map.entry("array", new Object[]{})
        ));
        this.rootReducer = (obj) -> {
            if(obj.action == null || obj.payload == null) {
                return new TAutomataStateContext(obj.state, obj.context);
            }
            if(!stateTransitionMatrix.containsKey(obj.state)) {
                throw new RuntimeException("Invalid state, maybe machine isn't running");
            }
            if(!stateTransitionMatrix.get(obj.state).containsKey(obj.action)) {
                return new TAutomataStateContext(obj.state, obj.context);
            }
            AutomataStateTransitionResult res = stateTransitionMatrix.get(obj.state).get(obj.action);
            return new TAutomataStateContext(
                    res.newState(),
                    res.getNewContext().apply(new AutomataPayloadContext(obj.payload, obj.context))
            );
        };
    }

    public Map getStateTransitionMatrix() { return this.stateTransitionMatrix; }

    public TAutomataStateContext getContext() { return new TAutomataStateContext(this.state, this.context); }

    private TAutomataBaseContext getDefaultContext(AutomataPayloadContext arg) {
        TAutomataBaseContext prevContext = arg.context();
        TAutomataBaseContext initialContext = new TAutomataBaseContext(Map.ofEntries(
                Map.entry("integer", prevContext.getOrDefault("integer", 3)),
                Map.entry("string", prevContext.getOrDefault("string", "str")),
                Map.entry("array", prevContext.getOrDefault("array", new Object[]{}))
        ));
        prevContext.forEach((key, value) -> initialContext.merge(key, value, (initValue, prevValue) -> prevValue));
        return initialContext;
    }

    public IAutomataReducer getReducer() { return this.rootReducer; }

    public TAutomataStateContext dispatch(TAutomataActionPayload action) {
        TAutomataStateContext reducedValue =
                this.rootReducer.apply(new TAutomataStateContextActionPayload(this.state, this.context, action.action, action.payload));
        this.setContext(reducedValue);
        return reducedValue;
    }

    public void setContext(TAutomataStateContext context) {
        this.state = context.state;
        this.context = context.context;
    }

    @Override
    public String toString() {
        return "GeneratedAutomata{" +
                "statesDictionary=" + statesDictionary +
                ", actionsDictionary=" + actionsDictionary +
                ", stateTransitionMatrix=" + stateTransitionMatrix +
                '}';
    }

    public abstract static class TAutomataBaseType {
        protected Long value;
        public Long getValue() { return value; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            TAutomataBaseType that = (TAutomataBaseType) o;
            return Objects.equals(value, that.value);
        }

        @Override
        public int hashCode() {
            return Objects.hash(value);
        }
    }

    public static class TAutomataBaseState extends TAutomataBaseType {

        private TAutomataBaseState() {}
        private TAutomataBaseState(Long value) { this.value = value; }

        public static TAutomataBaseState of(Long value) { return new TAutomataBaseState(value); }

    }

    public static class TAutomataBaseAction extends TAutomataBaseType {

        private TAutomataBaseAction() {}
        private TAutomataBaseAction(Long value) { this.value = value; }

        public static TAutomataBaseAction of(Long value) { return new TAutomataBaseAction(value); }

    }

    public static class TAutomataBaseContext extends HashMap<String, Object> {
        public TAutomataBaseContext(Map<String, Object> map) { super(map); }

        private TAutomataBaseContext(TAutomataBasePayload payload) {
            super();
            this.putAll(payload);
        }

        public static TAutomataBaseContext fromPayload(TAutomataBasePayload payload) {
            return new TAutomataBaseContext(payload);
        }
    }

    public static class TAutomataBasePayload extends HashMap<String, Object> {
    }

    public record AutomataStateTransitionResult (
            TAutomataBaseState newState,
            Function<AutomataPayloadContext, TAutomataBaseContext> getNewContext
    ) {
    }

    public interface IAutomataReducer extends Function<TAutomataStateContextActionPayload, TAutomataStateContext> {}

    public record TAutomataStateContext(TAutomataBaseState state, TAutomataBaseContext context) {}
    public record TAutomataStateContextActionPayload(TAutomataBaseState state, TAutomataBaseContext context, TAutomataBaseAction action, TAutomataBasePayload payload) {}
    public record AutomataPayloadContext(TAutomataBasePayload payload,TAutomataBaseContext context) {}
    public record TAutomataActionPayload(TAutomataBaseAction action, TAutomataBasePayload payload) {}
}
