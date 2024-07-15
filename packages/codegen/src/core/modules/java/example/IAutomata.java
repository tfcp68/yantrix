package org.example;

import org.example.interfaces.AutomataValidators.*;
import org.example.misc.AutomataActionQueue;
import org.example.misc.AutomataConsumeActionResult;
import org.example.types.automata.*;
import org.example.types.automata.AutomataTypes.*;

public interface IAutomata <
        State extends TAutomataBaseStateType,
        Action extends TAutomataBaseActionType,
        Event extends TAutomataBaseEventType,
        Context extends TAutomataContextType,
        Payload extends TAutomataPayloadType,
        EventMeta extends TAutomataEventMetaType
        >
        extends IAutomataValidatorContainer<State, Action, Event>
{
    /**
     * Reset the Instance and provide a Reducer, new State and optionally Validators
     */
    IAutomata<State, Action, Event, Context, Payload, EventMeta> init (
            TAutomataParams<State, Action, Event, Context, Payload, EventMeta> params
    );

    /**
     * Return current Reducer function
     */
    IAutomataReducer<State, Action, Context, Payload> getReducer();

    /**
     * When the Instance is Disabled, Consuming Actions doesn't change the internal state
     */
    void enable();

    /**
     * When the Instance is Disabled, Consuming Actions doesn't change the internal state
     */
    void disable(boolean clearQueue);

    /**
     * When the Instance is Disabled, Consuming Actions doesn't change the internal state
     */
    boolean isEnabled();

    /**
     * When the Instance is Paused, dispatched Actions aren't Consumed, but put into the Queue instead
     */
    boolean isPaused();

    /**
     * Pause the automata.
     */
    void pause();

    /**
     * Resuming will Collapse the Queue, unless the Instance is Disabled
     */
    void resume();

    /**
     * Returns internal State and Context of the Instance
     */
    TAutomataStateContext<State, Context> getContext();

    TAutomataQueue<Action, Payload> getActionQueue();
    /**
     * Consume all Actions in the Queue and return the resulting State<br>
     * Works even when Paused<br>
     * When Disabled, consumed Actions don't change the internal State<br>
     * Returns the final result of all consumed Actions
     */
    AutomataActionQueue<State, Action, Context, Payload> collapseActionQueue();
    void clearActionQueue();

    /**
     * Consume Action and return the new State and its context.<br>
     * The Queue is Collapsed beforehand, if not Disabled<br>
     * When Paused, puts an Action into the Queue instead<br>
     * When Disabled, doesn't change the internal State<br>
     * Returns the final result of all Actions, including the Queue
     */
    TAutomataStateContext<State, Context> dispatch(TAutomataActionPayload<Action, Payload> action);

    /**
     * Pop at most [count] Actions from the Queue and Consume them<br>
     * Works even when Paused<br>
     * When Disabled, consumed Actions don't change the internal State<br>
     * Returns the final result of all consumed Actions<br>
     * @param count Number of Actions to consume, defaults to 1
     */
    AutomataConsumeActionResult<State, Action, Context, Payload> consumeAction(int count);

}
