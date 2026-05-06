from typing import Any, List, Union, TypeVar

T = TypeVar('T')

# @@begin: and_
and_ = lambda *args: all(args)
all_ = and_
# @@end: and_

# @@begin: or_
or_ = lambda *args: any(args)
any_ = or_
# @@end: or_

# @@begin: not_
not_ = lambda x: not x
# @@end: not_

# @@begin: none
none = lambda *conditions: not any(conditions)
# @@end: none

# @@begin: is_even
is_even = lambda x: isinstance(x, int) and x % 2 == 0
# @@end: is_even

# @@begin: is_odd
is_odd = lambda x: isinstance(x, int) and x % 2 != 0
# @@end: is_odd

# @@begin: is_integer
is_integer = lambda x: isinstance(x, int) or (isinstance(x, float) and x == int(x))
# @@end: is_integer

# @@begin: is_negative
is_negative = lambda x: isinstance(x, (int, float)) and x < 0
# @@end: is_negative

# @@begin: is_positive
is_positive = lambda x: isinstance(x, (int, float)) and x > 0
# @@end: is_positive

# @@begin: is_greater
is_greater = lambda a, b: a > b
# @@end: is_greater

# @@begin: is_greater_or_equal
is_greater_or_equal = lambda a, b: a >= b
# @@end: is_greater_or_equal

# @@begin: is_less
is_less = lambda a, b: a < b
# @@end: is_less

# @@begin: is_less_or_equal
is_less_or_equal = lambda a, b: a <= b
# @@end: is_less_or_equal

# @@begin: is_equal
is_equal = lambda a, b: a == b
# @@end: is_equal

# @@begin: is_none
is_none = lambda x: x is None
# @@end: is_none

# @@begin: contains
contains = lambda container, value: _deep_get(container, value) is not None
# @@end: contains

# @@begin: has
has = _deep_has
# @@end: has

__all__ = [
    'and_', 'all_', 'or_', 'any_', 'not_', 'none',
    'is_even', 'is_odd', 'is_integer',
    'is_greater', 'is_greater_or_equal',
    'is_less', 'is_less_or_equal',
    'is_negative', 'is_positive',
    'contains', 'has',
    'is_equal', 'is_none',
]
