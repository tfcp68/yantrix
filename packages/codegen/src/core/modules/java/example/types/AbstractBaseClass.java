package types;

import java.util.UUID;

public abstract class AbstractBaseClass {

    private final String correlationId = UUID.randomUUID().toString();

    public AbstractBaseClass() {}
    public AbstractBaseClass(Object[] args) {}

    public AbstractBaseClass next() { return this; }
}
