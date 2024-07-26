package org.example.exceptions;

public class InvalidActionException extends AutomataException {
    public InvalidActionException() {super();}
    public InvalidActionException(String message) { super(message); }
}
