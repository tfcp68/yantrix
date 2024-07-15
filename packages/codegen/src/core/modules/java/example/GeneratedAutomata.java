package org.example;

import org.example.types.*;
//import org.example.types.TAutomataBaseContext;
//import org.example.types.TAutomataBaseState;
import org.example.types.automata.*;
import org.example.types.automata.AutomataTypes.*;
//import org.example.types.automata.AutomataTypes.TAutomataEvent;
//import org.example.types.automata.AutomataTypes.TAutomataParams;
//import org.example.types.automata.AutomataTypes.TAutomataStateContext;

import java.util.Map;
import java.util.Objects;

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


    private final Map<TAutomataBaseStateType, IAutomataReducer<TAutomataBaseStateType, TAutomataBaseActionType, TAutomataContextType, TAutomataPayloadType>> handlersDict = Map.of(
            TAutomataBaseState.of(1696941163L), this::handleStateChange1696941163,
            TAutomataBaseState.of(45657535L), this::handleStateChange45657535,
            TAutomataBaseState.of(1415394173L), this::handleStateChange1415394173
    );

    private TAutomataStateContext<TAutomataBaseStateType, TAutomataContextType> handleStateChange1696941163(TAutomataEvent<TAutomataBaseStateType, TAutomataBaseActionType, TAutomataContextType, TAutomataPayloadType> arg) {
        Map<TAutomataBaseActionType, TAutomataBaseStateType> actionToStateDict = Map.of(
                TAutomataBaseAction.of(1423436384L), TAutomataBaseState.of(45657535L)
        );
        TAutomataBaseStateType newState = actionToStateDict.getOrDefault(arg.action, arg.state);
        boolean isNewState = !Objects.equals(newState, arg.state);
        return TAutomataStateContext.of(
                isNewState ? newState : arg.state,
                isNewState ? TAutomataBaseContext.fromPayload(arg.payload) : arg.context
        );
    }

    private TAutomataStateContext<TAutomataBaseStateType, TAutomataContextType> handleStateChange45657535(TAutomataEvent<TAutomataBaseStateType, TAutomataBaseActionType, TAutomataContextType, TAutomataPayloadType> arg) {
        Map<TAutomataBaseActionType, TAutomataBaseStateType> actionToStateDict = Map.of(
                TAutomataBaseAction.of(1481692L), TAutomataBaseState.of(1415394173L)
        );
        TAutomataBaseStateType newState = actionToStateDict.getOrDefault(arg.action, arg.state);
        boolean isNewState = !Objects.equals(newState, arg.state);
        return TAutomataStateContext.of(
                isNewState ? newState : arg.state,
                isNewState ? TAutomataBaseContext.fromPayload(arg.payload) : arg.context
        );
    }

    private TAutomataStateContext<TAutomataBaseStateType, TAutomataContextType> handleStateChange1415394173(TAutomataEvent<TAutomataBaseStateType, TAutomataBaseActionType, TAutomataContextType, TAutomataPayloadType> arg) {
        Map<TAutomataBaseActionType, TAutomataBaseStateType> actionToStateDict = Map.of(
                TAutomataBaseAction.of(99594860L), TAutomataBaseState.of(1918712022L)
        );
        TAutomataBaseStateType newState = actionToStateDict.getOrDefault(arg.action, arg.state);
        boolean isNewState = !Objects.equals(newState, arg.state);
        return TAutomataStateContext.of(
                isNewState ? newState : arg.state,
                isNewState ? TAutomataBaseContext.fromPayload(arg.payload) : arg.context
        );
    }

    public GeneratedAutomata() {
        super();
        TAutomataBaseStateType initialState = TAutomataBaseState.of(1696941163L);
        TAutomataContextType context = new TAutomataBaseContext();
        IAutomataReducer<TAutomataBaseStateType, TAutomataBaseActionType, TAutomataContextType, TAutomataPayloadType> rootReducer = (event) -> {
            if(event.action == null || event.payload == null) {
                return TAutomataStateContext.of(event.state, event.context);
            }
            else return handlersDict.get(initialState).reduce(event);
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
