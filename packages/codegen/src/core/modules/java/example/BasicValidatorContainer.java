package org.example;

import org.example.interfaces.AutomataValidators.*;
import org.example.interfaces.TValidator;
import org.example.types.automata.TAutomataBaseActionType;
import org.example.types.automata.TAutomataBaseEventType;
import org.example.types.automata.TAutomataBaseStateType;

import java.util.Optional;
import java.util.function.Function;
import java.util.function.Predicate;

public class BasicValidatorContainer<
        State extends TAutomataBaseStateType,
        Action extends TAutomataBaseActionType,
        Event extends TAutomataBaseEventType
        >
        implements IAutomataValidatorContainer<State, Action, Event>
{

    private final TValidator<State> _defaultStateValidator = (num) -> (num != null && num.getValue() >= 0);
    private final TValidator<Action> _defaultActionValidator = (num) -> (num != null && num.getValue() >= 0);
    private final TValidator<Event> _defaultEventValidator = (num) -> (num != null && num.getValue() >= 0);

    private TValidator<State> _stateValidator;
    private TValidator<Action> _actionValidator;
    private TValidator<Event> _eventValidator;

    public TValidator<Action> getActionValidator() {
        return Optional.ofNullable(_actionValidator).orElse(_defaultActionValidator);
    }

    public TValidator<State> getStateValidator() {
        return Optional.ofNullable(_stateValidator).orElse(_defaultStateValidator);
    }

    public TValidator<Event> getEventValidator() {
        return Optional.ofNullable(_eventValidator).orElse(_defaultEventValidator);
    }

    @Override
    public void setActionValidator(TValidator<Action> validator) {
        if(validator == null) throw new RuntimeException("passed action validator is not a function");
        _actionValidator = validator;
    }

    @Override
    public void setStateValidator(TValidator<State> validator) {
        if(validator == null) throw new RuntimeException("passed state validator is not a function");
        _stateValidator = validator;
    }

    @Override
    public void setEventValidator(TValidator<Event> validator) {
        if(validator == null) throw new RuntimeException("passed event validator is not a function");
        _eventValidator = validator;
    }

    @Override
    public TValidator<Event> validateEvent() {
        return this.getEventValidator();
    }

    @Override
    public TValidator<State> validateState() {
        return this.getStateValidator();
    }

    @Override
    public TValidator<Action> validateAction() {
        return this.getActionValidator();
    }

    public boolean validateAction(Action action) {
        return this.getActionValidator().test(action);
    }
    public boolean validateState(State state) {
        return this.getStateValidator().test(state);
    }
    public boolean validateEvent(Event event) {
        return this.getEventValidator().test(event);
    }

}
