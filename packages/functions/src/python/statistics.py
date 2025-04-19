import statistics
import math
import decimal
from typing import Union, List, Any, Sequence

Numeric = Union[int, float, decimal.Decimal]

def _get_numeric_list(*args: Union[Numeric, List[Numeric]]) -> List[Numeric]:
    """Helper to handle list input or variable arguments."""
    if len(args) == 1 and isinstance(args[0], list):
        data = args[0]
        if not all(isinstance(arg, (int, float, decimal.Decimal)) for arg in data):
            raise TypeError("All elements in the list must be numeric")
        return data
    if not all(isinstance(arg, (int, float, decimal.Decimal)) for arg in args):
         raise TypeError("All arguments must be numeric or a single list of numerics")
    return list(args) # type: ignore

def max_(*args: Union[Numeric, List[Numeric]]) -> Numeric:
    """Returns the maximum value from the arguments or list."""
    try:
        data = _get_numeric_list(*args)
        if not data:
            raise ValueError("max_() arg is an empty sequence")
        return max(data)
    except TypeError as e:
        raise TypeError("All arguments must be numeric")

def min_(*args: Union[Numeric, List[Numeric]]) -> Numeric:
    """Returns the minimum value from the arguments or list."""
    try:
        data = _get_numeric_list(*args)
        if not data:
            raise ValueError("min_() arg is an empty sequence")
        return min(data)
    except TypeError as e:
        raise TypeError("All arguments must be numeric")

def avg(*args: Union[Numeric, List[Numeric]]) -> float:
    """Calculates the average (mean) of the arguments or list."""
    data = _get_numeric_list(*args)
    if not data:
        raise statistics.StatisticsError("avg requires at least one data point")

    float_data = [float(x) for x in data]
    return statistics.mean(float_data)

def med(*args: Union[Numeric, List[Numeric]]) -> Numeric:
    """Calculates the median (middle value) of the arguments or list."""
    data = _get_numeric_list(*args)
    if not data:
         raise statistics.StatisticsError("median requires at least one data point")
    return statistics.median(data)

def sum_(data: List[Numeric]) -> Numeric:
    """Calculates the sum of a list of numbers."""
    if not data:
        return 0
    if any(isinstance(arg, decimal.Decimal) for arg in data):
        return sum(decimal.Decimal(str(arg)) for arg in data)
    if any(isinstance(arg, float) for arg in data):
        return sum(float(arg) for arg in data)
    return sum(data)

def sumsq(data: List[Numeric]) -> Numeric:
    if not data:
        return 0
    squares = []
    use_decimal = any(isinstance(arg, decimal.Decimal) for arg in data)
    use_float = any(isinstance(arg, float) for arg in data)

    if use_decimal:
        squares = [(decimal.Decimal(str(x))**2) for x in data]
        return sum(squares)
    elif use_float:
        squares = [(float(x)**2) for x in data]
        return sum(squares)
    else:
        squares = [(x**2) for x in data]
        return sum(squares)

def sum_product(*lists: List[Numeric]) -> Numeric:
    """Calculates the sum of the products of corresponding values in multiple lists."""
    if not lists:
        return 0
    if len(lists) == 1:
         raise ValueError("sum_product requires at least two lists")

    list_len = len(lists[0])
    if not all(len(lst) == list_len for lst in lists):
        raise ValueError("All lists must have the same length for sum_product")
    if list_len == 0:
        return 0

    total_sum: Numeric = 0
    use_decimal = any(isinstance(item, decimal.Decimal) for lst in lists for item in lst)
    use_float = any(isinstance(item, float) for lst in lists for item in lst)

    for i in range(list_len):
        product: Numeric = 1
        items_at_i = [lst[i] for lst in lists]

        if use_decimal:
            product = decimal.Decimal(1)
            for item in items_at_i:
                product *= decimal.Decimal(str(item))
        elif use_float:
            product = 1.0
            for item in items_at_i:
                product *= float(item)
        else:
            for item in items_at_i:
                product *= item

        if isinstance(total_sum, decimal.Decimal) or isinstance(product, decimal.Decimal):
            total_sum = decimal.Decimal(str(total_sum)) + decimal.Decimal(str(product))
        elif isinstance(total_sum, float) or isinstance(product, float):
            total_sum = float(total_sum) + float(product)
        else:
            total_sum += product # type: ignore

    return total_sum


STATISTICS_FUNCTIONS = {
    'max': max_,
    'min': min_,
    'avg': avg,
    'med': med,
    'sum': sum_,
    'sumsq': sumsq,
    'sumProduct': sum_product,
}
