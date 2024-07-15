package org.example;


import org.example.interfaces.AutomataInterfaces.*;
import org.example.misc.AutomataActionQueue;
import org.example.misc.AutomataConsumeActionResult;
import org.example.types.automata.*;
import org.example.types.automata.AutomataTypes.*;

import java.util.Optional;

public class GenericAutomata <
            State extends TAutomataBaseStateType,
            Action extends TAutomataBaseActionType,
            Event extends TAutomataBaseEventType,
            Context extends TAutomataContextType,
            Payload extends TAutomataPayloadType,
            EventMeta extends TAutomataEventMetaType
        >
        extends BasicValidatorContainer<State, Action, Event>
        implements IAutomata<State, Action, Event, Context, Payload, EventMeta>
{

    private IAutomataEventAdapter<State, Action, Event, Context, Payload, EventMeta> eventAdapter;
    private State state;
    private Context context;
    private TAutomataQueue<Action, Payload> actionQueue;
    private IAutomataReducer<State, Action, Context, Payload> rootReducer;

    private boolean enabled = true;
    private boolean paused = false;

    public State state() { return state; }
    public Context context() { return context; }

    @Override
    public TAutomataStateContext<State, Context> getContext() { return TAutomataStateContext.of(this.state, this.context); }

    @Override
    public IAutomataReducer<State, Action, Context, Payload> getReducer() { return this.rootReducer; }

    @Override
    public void enable() { this.enabled = true; }
    @Override
    public void disable(boolean clearQueue) { this.enabled = false; if(clearQueue) clearActionQueue(); }
    @Override
    public boolean isEnabled() { return enabled; }
    @Override
    public boolean isPaused() { return paused; }
    @Override
    public void pause() { this.paused = true; }
    @Override
    public void resume() { this.paused = false; if(this.isEnabled()) collapseActionQueue(); }

    @Override
    public TAutomataQueue<Action, Payload> getActionQueue() { return this.actionQueue; }
    @Override
    public AutomataActionQueue<State, Action, Context, Payload> collapseActionQueue() {
        TAutomataQueue<Action, Payload> actions = this.actionQueue;
        TAutomataStateContext<State, Context> newState = this.reduceQueue();
        if(this.isEnabled()) {
            this.setContext(newState);
            this.clearActionQueue();
        }
        return new AutomataActionQueue<>(actions, newState);
    }
    @Override
    public void clearActionQueue() { actionQueue.clear(); }


    @Override
    public IAutomata<State, Action, Event, Context, Payload, EventMeta> init(TAutomataParams<State,Action,Event,Context,Payload,EventMeta> params) {
        if(params.rootReducer == null) this.rootReducer = null;
        else this.rootReducer = params.rootReducer;
        if (this.getStateValidator() == null) throw new Error("invalid initial state");
        this.actionQueue = new TAutomataQueue<>();
        this.enabled = params.enabled;
        this.paused = params.paused;
        this.setContext(TAutomataStateContext.of(params.state, params.context));
        if (params.stateValidator != null) this.setStateValidator(params.stateValidator);
        if (params.actionValidator != null) this.setActionValidator(params.actionValidator);
        if (params.eventValidator != null) this.setEventValidator(params.eventValidator);
        return this;
    }

    @Override
    public TAutomataStateContext<State, Context> dispatch(TAutomataActionPayload<Action, Payload> action) {
        if(this.getActionValidator() == null) throw new RuntimeException("invalid action");
        if(this.rootReducer == null) throw new RuntimeException("Root reducer is not defined");
        TAutomataStateContext<State, Context> reducedValue =
                this.rootReducer.reduce(new TAutomataEvent<>());
        if(reducedValue == null || this.getStateValidator() == null) throw new RuntimeException("invalid reduced state");
        if(this.isPaused()) {
            this.actionQueue.add(action);
        }
        else if(this.isEnabled()) {
            this.clearActionQueue();
            this.setContext(reducedValue);
        }
        return reducedValue;
    }

    @Override
    public AutomataConsumeActionResult<State, Action, Context, Payload> consumeAction(int count) {
        if(count < 1) throw new RuntimeException("invalid action count");
        AutomataConsumeActionResult<State, Action, Context, Payload> currentResponse = new AutomataConsumeActionResult<>(
                null, this.getContext()
        );
        TAutomataQueue<Action, Payload> queue = this.getActionQueue();
        while(!queue.isEmpty()) {
            this.reduceQueueItem(queue, currentResponse.newState());
        }
        if(this.isEnabled()) {
            this.setContext(currentResponse.newState());
        }
        return currentResponse;
    }

    public AutomataConsumeActionResult<State, Action, Context, Payload> reduceQueueItem(
            TAutomataQueue<Action, Payload> queue,
            TAutomataStateContext<State, Context> newState
    ) {
        AutomataConsumeActionResult<State, Action, Context, Payload> defaultResponse = new AutomataConsumeActionResult<>(
                null, Optional.ofNullable(newState).orElse(this.getContext())
        );
        if(queue == null || queue.size() < 1)
            return defaultResponse;

        TAutomataActionPayload<Action, Payload> currentAction = queue.poll();
        if(currentAction == null)
            return defaultResponse;

        if(this.getActionValidator() == null) throw new RuntimeException("invalid action");

        return new AutomataConsumeActionResult<>(
                currentAction,
                this.getReducer().reduce(new TAutomataEvent<>(newState.context, currentAction.payload))
        );
    }

    public TAutomataStateContext<State, Context> reduceQueue() {
        TAutomataStateContext<State, Context> reducedValue = this.getContext();
        if(this.rootReducer == null) throw new RuntimeException("root reducer is not defined");
        TAutomataQueue<Action, Payload> queue = this.getActionQueue();
        while(!queue.isEmpty()) reducedValue = this.reduceQueueItem(queue, reducedValue).newState();
        return reducedValue;
    }

    public void setContext(TAutomataStateContext<State, Context> context) {
        if(context == null || this.getStateValidator() == null) throw new RuntimeException("invalid context");
        this.state = context.state;
        this.context = context.context;
    }

    public void setActionQueue(TAutomataQueue<Action, Payload> queue) {
        if(queue == null) throw new RuntimeException("invalid action queue");
        this.actionQueue = queue;
    }
}
