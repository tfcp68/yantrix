package org.example.types.automata;

import org.example.interfaces.TValidator;

import java.util.ArrayList;
import java.util.PriorityQueue;
import java.util.Stack;
import java.util.concurrent.Future;
import java.util.function.BiFunction;
import java.util.function.Function;
import java.util.function.Predicate;

@SuppressWarnings("all")
public class AutomataTypes {

    public static class TAutomataStateContainer<State extends TAutomataBaseStateType> {
        public State state;
    }

    public static class TAutomataActionContainer<Action extends TAutomataBaseActionType> {
        public Action action;
    }

    public static class TAutomataEventContainer<Event extends TAutomataBaseEventType> {
        public Event event;
    }

    public static class TAutomataStateContext <
            State extends TAutomataBaseStateType,
            Context extends TAutomataContextType
            >
            extends TAutomataStateContainer<State> {
        public Context context;
        private TAutomataStateContext() {}
        private TAutomataStateContext(State state, Context context) {
            this.state = state;
            this.context = context;
        }

        public static <State extends TAutomataBaseStateType, Context extends TAutomataContextType> TAutomataStateContext<State, Context> of(State state, Context context) { return TAutomataStateContext.of(state, context); }
    }

    public static class TAutomataActionPayload<Action extends TAutomataBaseActionType, Payload extends TAutomataPayloadType> extends TAutomataActionContainer<Action> {
        public Payload payload;
    }

    public static class TAutomataEventMeta<Event extends TAutomataBaseEventType, EventMeta extends TAutomataEventMetaType> extends TAutomataEventContainer<Event> {
        public EventMeta meta;
    }

    public static class TAutomataEventHandler<
            Event extends TAutomataBaseEventType, Action extends TAutomataBaseActionType,
            EventMeta extends TAutomataEventMetaType, Payload extends TAutomataPayloadType
            >
    {
        Function<TAutomataEventMeta<Event, EventMeta>, TAutomataActionPayload<Action, Payload>> eventHandler;
    }

    @FunctionalInterface
    static interface IAutomataEventHandler <
            Event extends TAutomataBaseEventType, Action extends TAutomataBaseActionType,
            EventMeta extends TAutomataEventMetaType, Payload extends TAutomataPayloadType
            >
            extends Function<TAutomataEventMeta<Event, EventMeta>, TAutomataActionPayload<Action, Payload>>
    {
        default TAutomataActionPayload<Action, Payload> handle(TAutomataEventMeta<Event, EventMeta> eventMeta) {
            return this.apply(eventMeta);
        }
    }

    public static class TAutomataEventEmitter<
            Event extends TAutomataBaseEventType, State extends TAutomataBaseStateType,
            EventMeta extends TAutomataEventMetaType, Context extends TAutomataContextType
            >
    {
        Function<TAutomataStateContext<State, Context>, TAutomataEventMeta<Event, EventMeta>> eventEmitter;
    }

    @FunctionalInterface
    static interface IAutomataEventEmitter <
            Event extends TAutomataBaseEventType, State extends TAutomataBaseStateType,
            EventMeta extends TAutomataEventMetaType, Context extends TAutomataContextType
            >
            extends Function<TAutomataStateContext<State, Context>, TAutomataEventMeta<Event, EventMeta>>
    {
        default TAutomataEventMeta<Event, EventMeta> emit(TAutomataStateContext<State, Context> context) {
            return this.apply(context);
        }
    }

    public static class TAutomataEvent<
            State extends TAutomataBaseStateType, Action extends TAutomataBaseActionType,
            Context extends TAutomataContextType, Payload extends TAutomataPayloadType
            >
    {
        public State state;
        public Context context;
        public Action action;
        public Payload payload;

        public TAutomataEvent() {};
        public TAutomataEvent(Context context, Payload payload) {
            this.context = context;
            this.payload = payload;
        }
        public TAutomataEvent(State state, Action action, Context context, Payload payload) {
            this.state = state;
            this.action = action;
            this.context = context;
            this.payload = payload;
        }
    }

    public static class TAutomataReducer<
            State extends TAutomataBaseStateType, Action extends TAutomataBaseActionType,
            Context extends TAutomataContextType, Payload extends TAutomataPayloadType
            >
    {
        Function<TAutomataEvent<State, Action, Context, Payload>, TAutomataStateContext<State, Context>> reducer;
        public TAutomataReducer(Function<TAutomataEvent<State, Action, Context, Payload>, TAutomataStateContext<State, Context>> reducer) {
            this.reducer = reducer;
        }
        public Function<TAutomataEvent<State, Action, Context, Payload>, TAutomataStateContext<State, Context>> getReducer() { return reducer; }
    }

    @FunctionalInterface
    public static interface IAutomataReducer<
            State extends TAutomataBaseStateType, Action extends TAutomataBaseActionType,
            Context extends TAutomataContextType, Payload extends TAutomataPayloadType
            >
            extends Function<TAutomataEvent<State, Action, Context, Payload>, TAutomataStateContext<State, Context>>
    {
        default TAutomataStateContext<State, Context> reduce(TAutomataEvent<State, Action, Context, Payload> event) {
            return this.apply(event);
        }
    }

    public static class TAutomataDispatch<
            State extends TAutomataBaseStateType, Action extends TAutomataBaseActionType,
            Context extends TAutomataContextType, Payload extends TAutomataPayloadType
            >
    {
        Function<TAutomataActionPayload<Action, Payload>, TAutomataReducer<State, Action, Context, Payload>> dispatch;
    }

    @FunctionalInterface
    static interface IAutomataDispatch<
            State extends TAutomataBaseStateType, Action extends TAutomataBaseActionType,
            Context extends TAutomataContextType, Payload extends TAutomataPayloadType
            >
            extends
            Function<TAutomataActionPayload<Action, Payload>, TAutomataReducer<State, Action, Context, Payload>>
    {
        default TAutomataReducer<State, Action, Context, Payload> dispatch(TAutomataActionPayload<Action, Payload> payload) {
            return this.apply(payload);
        }
    }

    public static class TAutomataParams<
            State extends TAutomataBaseStateType, Action extends TAutomataBaseActionType, Event extends TAutomataBaseEventType,
            Context extends TAutomataContextType, Payload extends TAutomataPayloadType, EventMeta extends TAutomataEventMetaType
            >
            extends TAutomataStateContext<State, Context>
    {
        public IAutomataReducer<State, Action, Context, Payload> rootReducer;
        public TValidator<State> stateValidator;
        public TValidator<Action> actionValidator;
        public TValidator<Event> eventValidator;
        public boolean enabled;
        public boolean paused;

        public TAutomataParams() {}
        public TAutomataParams(State state, Context context,
                               IAutomataReducer<State, Action, Context, Payload> rootReducer,
                               TValidator<State> stateValidator,
                               TValidator<Action> actionValidator,
                               TValidator<Event> eventValidator) {
            super(state, context);
            this.stateValidator = stateValidator;
            this.actionValidator = actionValidator;
            this.eventValidator = eventValidator;
            this.rootReducer = rootReducer;
        }
    }

    public static class TAutomataQueue<
            Action extends TAutomataBaseActionType,
            Payload extends TAutomataPayloadType
            >
            extends PriorityQueue<TAutomataActionPayload<Action, Payload>>
    {

    }

    public static class TAutomataEventStack<
            Event extends TAutomataBaseEventType,
            EventMeta extends TAutomataEventMetaType
            >
            extends Stack<TAutomataEventMeta<Event, EventMeta>>
    {

    }

    public static class TAutomataEffect<
            Model,
            Event extends TAutomataBaseEventType,
            EventMeta extends TAutomataEventMeta
            >
    {
        BiFunction<EventMeta, Model, Model> effect;
    }

    public static class TGenericTransformer<Data>
    {
        Function<Data, Data> transformer;
    }

    public static class TContextTransformer<
            State extends TAutomataBaseStateType,
            Context extends TAutomataContextType
            >
    {
        Function<TAutomataStateContext<State, Context>, TAutomataStateContext<State, Context>> contextTransformer;
    }

    public static class THighOrderPredicate
    {
        Function<ArrayList<Predicate<Object>>, Boolean> predicate;
    }

    public static class TModelPredicate<Model>
    {
        Function<Model, THighOrderPredicate> predicate;
    }

    public static class TContextPredicate<
            State extends TAutomataBaseStateType,
            Context extends TAutomataContextType
            >
    {
        Function<TAutomataStateContext<State, Context>, THighOrderPredicate> predicate;
    }

    public static class TEventBusTask<
            Event extends TAutomataBaseEventType,
            EventMeta extends TAutomataEventMetaType
            > extends TAutomataEventMeta<Event, EventMeta>
    {
        String task_id;
        Future<TAutomataEventStack<Event, EventMeta>> result;
    }

    public static class TEventBusHandler<
            Event extends TAutomataBaseEventType,
            EventMeta extends TAutomataEventMetaType
            >
    {
        Function<TAutomataEventMeta<Event, EventMeta>, TEventBusTask<Event, EventMeta>> handler;
    }

}
