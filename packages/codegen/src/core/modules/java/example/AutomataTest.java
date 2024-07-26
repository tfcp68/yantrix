import static org.junit.jupiter.api.Assertions.*;

import org.example.GeneratedAutomata;
import org.example.exceptions.AutomataException;
import org.example.exceptions.InvalidActionException;
import org.example.interfaces.TValidator;
import org.example.types.TAutomataBaseAction;
import org.example.types.TAutomataBaseEvent;
import org.example.types.TAutomataBasePayload;
import org.example.types.TAutomataBaseState;
import org.example.types.automata.*;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.jar.JarOutputStream;

import static org.example.GeneratedAutomata.statesDictionary;
import static org.example.GeneratedAutomata.actionsDictionary;

public class AutomataTest {

    private static GeneratedAutomata automata;

    @BeforeEach
    void resetAutomata() {
        automata = new GeneratedAutomata();
        automata.enable();
        automata.resume();
        assertNotNull(automata);
    }

    @Test
    void eventValidatorBaseTest() {
        TValidator<TAutomataBaseEventType> eventValidator = automata.getEventValidator();
        assertNotNull(eventValidator);
        assertTrue(eventValidator.test(TAutomataBaseEvent.of(1111L)));
        assertFalse(eventValidator.test(null));
        assertFalse(eventValidator.test(TAutomataBaseEvent.of(-1L)));
    }

    @Test
    void eventValidatorSetTest() {
        TValidator<TAutomataBaseEventType> newValidator = (event) -> event.getValue() > 10L;
        automata.setEventValidator(newValidator);
        assertTrue(automata.getEventValidator().test(TAutomataBaseEvent.of(11L)));
        assertFalse(automata.getEventValidator().test(TAutomataBaseEvent.of(9L)));
    }

    @Test
    void eventValidatorExceptionOnSetToNull() {
        assertThrows(RuntimeException.class, () -> automata.setEventValidator(null));
    }

    @Test
    void actionValidatorBaseTest() {
        TValidator<TAutomataBaseActionType> actionValidator = automata.getActionValidator();
        assertNotNull(actionValidator);
        assertTrue(actionValidator.test(TAutomataBaseAction.of(1111L)));
        assertFalse(actionValidator.test(null));
        assertFalse(actionValidator.test(TAutomataBaseAction.of(-1L)));
    }

    @Test
    void actionValidatorSetTest() {
        TValidator<TAutomataBaseActionType> newValidator = (action) -> action.getValue() > 10L;
        automata.setActionValidator(newValidator);
        assertTrue(automata.getActionValidator().test(TAutomataBaseAction.of(11L)));
        assertFalse(automata.getActionValidator().test(TAutomataBaseAction.of(9L)));
    }

    @Test
    void actionValidatorExceptionOnSetToNull() {
        assertThrows(RuntimeException.class, () -> automata.setActionValidator(null));
    }

    @Test
    void stateValidatorBaseTest() {
        TValidator<TAutomataBaseStateType> stateValidator = automata.getStateValidator();
        assertNotNull(stateValidator);
        assertTrue(stateValidator.test(TAutomataBaseState.of(1111L)));
        assertFalse(stateValidator.test(null));
        assertFalse(stateValidator.test(TAutomataBaseState.of(-1L)));
    }

    @Test
    void stateValidatorSetTest() {
        TValidator<TAutomataBaseStateType> newValidator = (state) -> state.getValue() > 10L;
        automata.setStateValidator(newValidator);
        assertTrue(automata.getStateValidator().test(TAutomataBaseState.of(11L)));
        assertFalse(automata.getStateValidator().test(TAutomataBaseState.of(9L)));
    }

    @Test
    void stateValidatorExceptionOnSetToNull() {
        assertThrows(RuntimeException.class, () -> automata.setStateValidator(null));
    }

    @Test
    void contextNotNull() {
        AutomataTypes.TAutomataStateContext<TAutomataBaseStateType, TAutomataContextType> context = automata.getContext();
        assertNotNull(context);
    }

    @Test
    void contextHasInitialState() {
        TAutomataBaseStateType initialState = automata.getContext().state;
        assertNotNull(initialState);

        // initial state is valid
        assertTrue(automata.getStateValidator().test(initialState));
    }

    @Test
    void automataEnabledAndDisabled() {
        assertTrue(automata.isEnabled());
        automata.disable(false);
        assertFalse(automata.isEnabled());
        automata.enable();
        assertTrue(automata.isEnabled());
    }

    @Test
    void automataPausedAndResumed() {
        assertFalse(automata.isPaused());
        automata.pause();
        assertTrue(automata.isPaused());
        automata.resume();
        assertFalse(automata.isPaused());
    }

    @Test
    void reducerNotNull() {
        assertNotNull(automata.getReducer());
    }

    @Test
    void automataHasStateDictionary() {
        assertNotNull(statesDictionary);
        assertTrue(() -> !statesDictionary.isEmpty());
    }

    @Test
    void automataHasActionDictionary() {
        assertNotNull(actionsDictionary);
        assertTrue(() -> !actionsDictionary.isEmpty());
    }

    @Test
    void automataHasStateTransitionMatrix() {
        assertNotNull(automata.stateTransitionMatrix);
        assertTrue(() -> !automata.stateTransitionMatrix.isEmpty());
    }

    @Test
    void automataInitialState() {
        assertEquals(automata.state(), statesDictionary.get("/~~~START~~~"));
    }

    @Test
    void dispatchStateChangeOnCorrectAction() {
        assertEquals(automata.state(), statesDictionary.get("/~~~START~~~"));
        automata.dispatch(new AutomataTypes.TAutomataActionPayload<>(
                actionsDictionary.get("/RESET"),
                new TAutomataBasePayload()
        ));
        assertEquals(automata.state(), statesDictionary.get("/INIT"));
    }

    @Test
    void dispatchNoStateChangeOnIncorrectAction() {
        assertEquals(automata.state(), statesDictionary.get("/~~~START~~~"));
        automata.dispatch(new AutomataTypes.TAutomataActionPayload<>(
                actionsDictionary.get("/CREATE_GAME"),
                new TAutomataBasePayload()
        ));
        assertEquals(automata.state(), statesDictionary.get("/~~~START~~~"));
    }

    @Test
    void noDispatchOnNullAction() {
        assertEquals(automata.state(), statesDictionary.get("/~~~START~~~"));
        assertThrows(
                InvalidActionException.class,
                () -> automata.dispatch(new AutomataTypes.TAutomataActionPayload<>(
                        null,
                        new TAutomataBasePayload()
                ))
        );
    }

    @Test
    void noDispatchOnNoReducer() {
        AutomataTypes.TAutomataParams<TAutomataBaseStateType, TAutomataBaseActionType, TAutomataBaseEventType,
        TAutomataContextType, TAutomataPayloadType, TAutomataEventMetaType> params =
            new AutomataTypes.TAutomataParams<>(
                    null,
                    null,
                    null,
                    automata.getStateValidator(),
                    automata.getActionValidator(),
                    automata.getEventValidator()
            );
        automata.init(params);

        assertThrows(
                AutomataException.class,
                () -> automata.dispatch(new AutomataTypes.TAutomataActionPayload<>(
                        actionsDictionary.get("/RESET"),
                        new TAutomataBasePayload(
                                Map.of("players", 3)
                        )
                ))
        );
    }

}
