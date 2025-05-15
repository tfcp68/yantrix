from typing import Any, List, Union, TypeVar
from pydash import (
    every, some, is_list, is_equal, is_none, is_number, is_object, is_string,
    values, is_even as pydash_is_even, is_odd as pydash_is_odd,
    is_integer as pydash_is_integer, is_greater as pydash_is_greater,
    is_greater_or_equal as pydash_is_greater_or_equal,
    is_less as pydash_is_less, is_less_or_equal as pydash_is_less_or_equal,
    is_negative as pydash_is_negative, is_positive as pydash_is_positive,
    has as pydash_has, get as pydash_get
)

T = TypeVar('T')

# Logical Predicates
and_ = every
all_ = every
or_ = some
any_ = some
not_ = lambda x: not x
none = lambda *conditions: not_(and_(*conditions))

# Numeric Predicates
is_even = pydash_is_even
is_odd = pydash_is_odd
is_integer = pydash_is_integer
is_greater = pydash_is_greater
is_greater_or_equal = pydash_is_greater_or_equal
is_less = pydash_is_less
is_less_or_equal = pydash_is_less_or_equal
is_negative = pydash_is_negative
is_positive = pydash_is_positive

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
    'is_equal', 'is_none'
]
