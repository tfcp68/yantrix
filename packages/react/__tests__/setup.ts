import '@testing-library/react';

// required by @testing-library/react to suppress "not configured to support act()" warnings
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
