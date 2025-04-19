import random
from typing import Any, Optional, Union, Tuple
import decimal # Potentially for random range

Numeric = Union[int, float, decimal.Decimal]

def if_(condition: Any, value_if_true: Any, value_if_false: Any) -> Any:
    """Returns value_if_true if condition is truthy, otherwise value_if_false."""
    return value_if_true if condition else value_if_false

def case(*args: Any) -> Any:
    """Evaluates arguments in pairs (condition, result) and returns the result
       corresponding to the first true condition. If no condition is true,
       returns the last argument if it exists (as the 'else' value), otherwise None.
    """
    if not args:
        return None

    num_args = len(args)
    for i in range(0, num_args - 1, 2):
        condition = args[i]
        result = args[i+1]
        if condition:
            return result

    if num_args % 2 != 0:
        return args[-1]
    else:
        return None

def coalesce(*args: Any) -> Any:
    """Returns the first non-Null (non-None in Python) argument."""
    for arg in args:
        if arg is not None:
            return arg
    return None

def random_(*args: Numeric) -> float:
    """Generates a random float.
       - With no arguments: returns a float between 0.0 (inclusive) and 1.0 (exclusive).
       - With two arguments (min_val, max_val): returns a float between min_val and max_val.
    """
    if not args:
        # random.random() gives [0.0, 1.0)
        return random.random()
    elif len(args) == 2:
        min_val, max_val = args
        low = min(float(min_val), float(max_val))
        high = max(float(min_val), float(max_val))
        # random.uniform handles floats correctly
        return random.uniform(low, high)
    else:
        raise TypeError(f"random expected 0 or 2 arguments, got {len(args)}")

CONDITIONAL_FUNCTIONS = {
    'if': if_,
    'case': case,
    'coalesce': coalesce,
    'random': random_,
}
