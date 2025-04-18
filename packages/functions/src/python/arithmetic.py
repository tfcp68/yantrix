import math
import decimal
from typing import Union, List, Any

Numeric = Union[int, float, decimal.Decimal]

def add(*args: Numeric) -> Numeric:
    """Calculates the sum of all arguments."""
    if not args:
        return 0
    # Use Decimal for precision if any arg is Decimal
    if any(isinstance(arg, decimal.Decimal) for arg in args):
        return sum(decimal.Decimal(str(arg)) for arg in args)
    # Use float if any arg is float
    if any(isinstance(arg, float) for arg in args):
        return sum(float(arg) for arg in args)
    # Otherwise, assume int
    return sum(args)

def diff(num1: Numeric, num2: Numeric) -> Numeric:
    """Calculates the difference between the second and first number (num2 - num1)."""
    if isinstance(num1, decimal.Decimal) or isinstance(num2, decimal.Decimal):
        return decimal.Decimal(str(num2)) - decimal.Decimal(str(num1))
    if isinstance(num1, float) or isinstance(num2, float):
         return float(num2) - float(num1)
    return num2 - num1

def mult(*args: Numeric) -> Numeric:
    """Calculates the product of all arguments."""
    if not args:
        return 1 # Multiplicative identity
    result: Numeric = 1
    use_decimal = any(isinstance(arg, decimal.Decimal) for arg in args)
    use_float = any(isinstance(arg, float) for arg in args)

    if use_decimal:
        result = decimal.Decimal(1)
        for arg in args:
            result *= decimal.Decimal(str(arg))
    elif use_float:
        result = 1.0
        for arg in args:
            result *= float(arg)
    else:
         for arg in args:
            result *= arg
    return result


def div(num1: Numeric, num2: Numeric) -> Union[float, decimal.Decimal]:
    """Calculates the division of the first number by the second number (num1 / num2)."""
    if num2 == 0:
        raise ValueError("Division by zero")
    if isinstance(num1, decimal.Decimal) or isinstance(num2, decimal.Decimal):
        return decimal.Decimal(str(num1)) / decimal.Decimal(str(num2))
    # Always return float for division unless Decimal is involved
    return float(num1) / float(num2)

def pow_(base: Numeric, exponent: Numeric) -> Numeric:
    """Calculates the base raised to the power of the exponent."""
    if isinstance(base, decimal.Decimal) or isinstance(exponent, decimal.Decimal):
        return decimal.Decimal(str(base)) ** decimal.Decimal(str(exponent))
    if isinstance(base, float) or isinstance(exponent, float):
         return float(base) ** float(exponent)
    return base ** exponent # type: ignore

def inc(num: Numeric) -> Numeric:
    """Increments the number by 1."""
    return add(num, 1)

def dec(num: Numeric) -> Numeric:
    """Decrements the number by 1."""
    return add(num, -1)

def neg(num: Numeric) -> Numeric:
    """Negates the number."""
    return mult(num, -1)

def inv(num: Numeric) -> Union[float, decimal.Decimal]:
    """Calculates the inverse of the number (1 / num)."""
    return div(1, num)

def mod(num1: Numeric, num2: Numeric) -> Numeric:
    """Calculates the modulo (remainder of num1 / num2).

    For negative values, follows Python's modulo behavior:
    - Result has the same sign as the divisor (num2)
    - (num1 % num2) = num1 - num2 * floor(num1 / num2)
    """
    if num2 == 0:
        raise ValueError("Modulo by zero")
    if isinstance(num1, decimal.Decimal) or isinstance(num2, decimal.Decimal):
        d_num1 = decimal.Decimal(str(num1))
        d_num2 = decimal.Decimal(str(num2))
        # Implement Python's modulo behavior for Decimal
        if d_num1 < 0 and d_num2 > 0:
            # When first arg is negative and second is positive
            # Python modulo returns a value between 0 and num2
            return ((d_num1 % d_num2) + d_num2) % d_num2
        return d_num1 % d_num2
    if isinstance(num1, float) or isinstance(num2, float):
        return float(num1) % float(num2)
    return num1 % num2

def trunc(num: Numeric) -> int:
    """Truncates the number towards zero."""
    return math.trunc(num)

def ceil(num: Numeric) -> int:
    """Returns the smallest integer greater than or equal to the number."""
    return math.ceil(num)

def round_(num: Numeric, precision: int = 0) -> Numeric:
    """Rounds the number to the specified precision."""
    if not isinstance(precision, int) or precision < 0:
        raise ValueError("Precision must be a non-negative integer")
    if isinstance(num, decimal.Decimal):
        # Use ROUND_HALF_UP for standard rounding
        return num.quantize(decimal.Decimal('1e-' + str(precision)), rounding=decimal.ROUND_HALF_UP)
    if precision == 0:
         # round() without precision returns int
        return int(round(num))
    else:
        # round() with precision returns float
        return round(num, precision)

# Dictionary to hold the functions for potential dynamic lookup
ARITHMETIC_FUNCTIONS = {
    'add': add,
    'diff': diff,
    'mult': mult,
    'div': div,
    'pow': pow_, # Use pow_ to avoid conflict with built-in pow
    'inc': inc,
    'dec': dec,
    'neg': neg,
    'inv': inv,
    'mod': mod,
    'trunc': trunc,
    'ceil': ceil,
    'round': round_, # Use round_ to avoid conflict with built-in round
}
