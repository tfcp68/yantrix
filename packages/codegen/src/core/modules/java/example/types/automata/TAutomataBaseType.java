package org.example.types.automata;

import java.util.Objects;

public abstract class TAutomataBaseType {
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
