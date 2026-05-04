from typing import Any, List, Union, TypeVar
from pydash import (
    every, some, is_list, is_equal, is_none, is_number, is_object, is_string,
    values, is_even, is_odd, is_integer, is_negative, is_positive,
    gt, gte, lt, lte,
    has as pydash_has, get as pydash_get,
)

T = TypeVar('T')

# Logical Predicates
and_ = every
all_ = every
or_ = some
any_ = some
not_ = lambda x: not x
none = lambda *conditions: not any(conditions)

# Numeric Predicates (pydash 8.x uses gt/lt/gte/lte for comparisons)
is_greater = gt
is_greater_or_equal = gte
is_less = lt
is_less_or_equal = lte

# Lookup Predicates
contains = lambda container, value: pydash_get(container, value, None) is not None
has = pydash_has

__all__ = [
    'and_', 'all_', 'or_', 'any_', 'not_', 'none',
    'is_even', 'is_odd', 'is_integer',
    'is_greater', 'is_greater_or_equal',
    'is_less', 'is_less_or_equal',
    'is_negative', 'is_positive',
    'contains', 'has',
    'is_equal', 'is_none',
]
