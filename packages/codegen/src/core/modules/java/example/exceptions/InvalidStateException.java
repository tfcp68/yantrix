package org.example.exceptions;

public class InvalidStateException extends AutomataException {
    public InvalidStateException() {super();}
    public InvalidStateException(String message) { super(message); }
}
