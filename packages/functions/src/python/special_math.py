import math
import decimal
from typing import Union

Numeric = Union[int, float, decimal.Decimal]

def sin(num: Numeric) -> float:
    """Calculates the sine of the argument (assumed to be in radians)."""
    return math.sin(float(num))

def cos(num: Numeric) -> float:
    """Calculates the cosine of the argument (assumed to be in radians)."""
    return math.cos(float(num))

def sqrt(num: Numeric) -> float:
    """Calculates the square root of the argument."""
    if num < 0:
        raise ValueError("Cannot calculate square root of a negative number")
    return math.sqrt(float(num))

def log(num: Numeric, base: Numeric) -> float:
    """Calculates the logarithm of the number to the specified base."""
    if num <= 0 or base <= 0 or base == 1:
        raise ValueError("Logarithm requires positive number and positive base != 1")
    return math.log(float(num), float(base))

def ln(num: Numeric) -> float:
    """Calculates the natural logarithm (base e) of the number."""
    if num <= 0:
        raise ValueError("Natural logarithm requires positive number")
    return math.log(float(num))

def lg(num: Numeric) -> float:
    """Calculates the base-10 logarithm of the number."""
    if num <= 0:
        raise ValueError("Base-10 logarithm requires positive number")
    return math.log10(float(num))

def deg(num: Numeric) -> float:
    """Converts degrees to radians."""
    # Renamed from rad in spec to match math.radians functionality
    return math.radians(float(num))

def rad(num: Numeric) -> float:
    """Converts radians to degrees."""
    # Renamed from deg in spec to match math.degrees functionality
    return math.degrees(float(num))

# Dictionary for potential dynamic lookup
SPECIAL_MATH_FUNCTIONS = {
    'sin': sin,
    'cos': cos,
    'sqrt': sqrt,
    'log': log,
    'ln': ln,
    'lg': lg,
    'deg': deg,
    'rad': rad,
}
