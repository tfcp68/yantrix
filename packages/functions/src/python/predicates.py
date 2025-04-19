import math
import decimal
from typing import Union, Any, List, Dict, Hashable, Sequence

Numeric = Union[int, float, decimal.Decimal]
DictObject = Dict[Hashable, Any]

# --- Binary Predicates ---

def and_(*conditions: Any) -> bool:
    """Returns True if all conditions are truthy, False otherwise."""
    return all(conditions)

def or_(*conditions: Any) -> bool:
    """Returns True if at least one condition is truthy, False otherwise."""
    return any(conditions)

def not_(condition: Any) -> bool:
    """Returns the boolean negation of the condition."""
    return not condition

def none_(*conditions: Any) -> bool:
    """Returns True if none of the conditions are truthy (equivalent to not(or(...)))."""
    return not any(conditions)

# --- Numeric Predicates ---

def is_even(num: Numeric) -> bool:
    """Checks if a number is even."""
    if isinstance(num, (float, decimal.Decimal)) and num % 1 != 0:
        return False
    try:
        return int(num) % 2 == 0
    except (TypeError, ValueError):
        return False

def is_odd(num: Numeric) -> bool:
    """Checks if a number is odd."""
    if isinstance(num, (float, decimal.Decimal)) and num % 1 != 0:
        return False
    try:
        return int(num) % 2 != 0
    except (TypeError, ValueError):
        return False

def is_integer(num: Any) -> bool:
    """Checks if a value is an integer type or a float/decimal with no fractional part."""
    if isinstance(num, int):
        return True
    if isinstance(num, (float, decimal.Decimal)):
        try:
            return num % 1 == 0
        except (TypeError, decimal.InvalidOperation):
             return False
    return False

def is_equal(val1: Any, val2: Any) -> bool:
    """Checks if two values are equal (type and value)."""
    return val1 == val2

def is_greater(num1: Numeric, num2: Numeric) -> bool:
    """Checks if num1 > num2."""
    try:
        return num1 > num2
    except TypeError:
        raise TypeError(f"Cannot compare {type(num1)} and {type(num2)} with >")

def is_greater_or_equal(num1: Numeric, num2: Numeric) -> bool:
    """Checks if num1 >= num2."""
    try:
        return num1 >= num2
    except TypeError:
        raise TypeError(f"Cannot compare {type(num1)} and {type(num2)} with >=")

def is_less(num1: Numeric, num2: Numeric) -> bool:
    """Checks if num1 < num2."""
    try:
        return num1 < num2
    except TypeError:
        raise TypeError(f"Cannot compare {type(num1)} and {type(num2)} with <")

def is_less_or_equal(num1: Numeric, num2: Numeric) -> bool:
    """Checks if num1 <= num2."""
    try:
        return num1 <= num2
    except TypeError:
        raise TypeError(f"Cannot compare {type(num1)} and {type(num2)} with <=")

def is_negative(num: Numeric) -> bool:
    """Checks if a number is less than 0."""
    try:
        return num < 0
    except TypeError:
         raise TypeError(f"Cannot compare {type(num)} with 0 using <")

def is_positive(num: Numeric) -> bool:
    """Checks if a number is greater than or equal to 0."""
    # Note: Spec implies >= 0
    try:
        return num >= 0
    except TypeError:
        raise TypeError(f"Cannot compare {type(num)} with 0 using >=")

# --- Lookup Predicates ---

def contains(container: Union[str, Sequence, DictObject], value: Any) -> bool:
    """Checks for containment based on the container type:
       - String: Checks if 'value' (string) is a substring.
       - List/Sequence: Checks if 'value' is present in the sequence.
       - Object/Dict: Checks if 'value' (string/hashable) is a *key* in the dictionary.
         (Spec says "value with a name", implying key check for Object case).
    """
    if isinstance(container, str):
        if not isinstance(value, str):
             return False
        return value in container
    elif isinstance(container, dict):
        # Check if value is a key
        try:
            return value in container
        except TypeError:
            return False
    elif isinstance(container, Sequence):
        return value in container
    else:
        return False

def has(container: Union[Sequence, DictObject], key_or_index: Union[str, int, Hashable]) -> bool:
    """Checks for existence based on the container type:
       - List/Sequence: Checks if 'key_or_index' (int) is a valid index.
       - Object/Dict: Checks if 'key_or_index' (string/hashable) is a key.
    """
    if isinstance(container, dict):
        try:
            return key_or_index in container
        except TypeError:
            return False
    elif isinstance(container, Sequence) and not isinstance(container, str):
        if not isinstance(key_or_index, int):
            return False
        try:
            return 0 <= key_or_index < len(container)
        except TypeError:
             return False
    else:
        return False

def is_null(value: Any) -> bool:
    """Checks if a value is None (Python's equivalent of Null)."""
    return value is None


PREDICATE_FUNCTIONS = {
    # Binary
    'and': and_,
    'all': and_,
    'or': or_,
    'any': or_,
    'not': not_,
    'none': none_,
    # Numeric
    'isEven': is_even,
    'isOdd': is_odd,
    'isInteger': is_integer,
    'isEqual': is_equal,
    'isGreater': is_greater,
    'isGreaterOrEqual': is_greater_or_equal,
    'isLess': is_less,
    'isLessOrEqual': is_less_or_equal,
    'isNegative': is_negative,
    'isPositive': is_positive,
    # Lookup
    'contains': contains,
    'has': has,
    'isNull': is_null,
}
