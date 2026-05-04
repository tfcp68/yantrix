# --- Python builtins (auto-generated from @yantrix/functions/src/python/) ---
# Requires: pydash (pip install pydash)

from typing import Any, List, Optional, Tuple, Union, TypeVar
from pydash import find, is_boolean, is_number, is_none, is_list, get
import random as _random_stdlib
from typing import Any, List, Union, TypeVar
from pydash import (
    every, some, is_list, is_equal, is_none, is_number, is_object, is_string,
    values, is_even, is_odd, is_integer, is_negative, is_positive,
    gt, gte, lt, lte,
    has as pydash_has, get as pydash_get,
)
import math
from typing import Any, List, Tuple, TypeVar, Union, Optional
from pydash import (
    add, subtract, multiply, divide, power,
    negate,
    ceil, round_, truncate,
    filter_, pluck as pydash_pluck,
    get as pydash_get, map_values as pydash_map_values,
    has as pydash_has, pick, find as pydash_find,
    times, sort_by, shuffle, reverse,
)


T = TypeVar('T')
A = TypeVar('A')

TCasePair = Tuple[bool, T]
TNestedArray = List[Union[TCasePair[T], List[TCasePair[T]]]]

# Conditionals
_if = lambda condition, true_value, false_value: true_value if condition else false_value

is_valid_pair = lambda pair: is_list(pair) and len(pair) == 2 and is_boolean(pair[0])
flatten_pairs = lambda input_: ([pair for item in input_ if is_list(item) for pair in flatten_pairs(item)]
                               if is_list(input_) else [])
_case = lambda *args: (
    args[1] if args[0] else (args[2] if len(args) > 2 else None)
    if len(args) >= 2 and isinstance(args[0], bool)
    else next((pair[1] for pair in flatten_pairs(args[0]) if pair[0]), None)
    if len(args) == 1 and is_list(args[0])
    else next((pair[1] for pair in flatten_pairs(args[0]) if pair[0]), args[1])
    if len(args) == 2 and is_list(args[0])
    else None
)

coalesce = lambda *values: next((v for v in values if v is not None), None)

random = lambda min_=None, max_=None: (
    _random_stdlib.randint(min_, max_ - 1) if min_ is not None and max_ is not None
    else _random_stdlib.randint(0, 1)
)

_random = _random_stdlib.random

__all__ = ['_case', 'coalesce', '_if', 'random', '_random']


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


T = TypeVar('T')

# Arithmetic Transformers
diff = subtract
mult = multiply
div = divide
pow_ = power
inc = lambda n: n + 1 if isinstance(n, (int, float)) else None
dec = lambda n: n - 1 if isinstance(n, (int, float)) else None
neg = negate
inv = lambda n: 1 / n if isinstance(n, (int, float)) and n != 0 else None
mod = lambda a, b: a % b if b != 0 else None
trunc = truncate

# Rounding
round__ = round_

# Special Math Transformers (stdlib)
sin = math.sin
cos = math.cos
sqrt = math.sqrt
log = lambda x, base=None: math.log(x, base) if base is not None else math.log(x)
ln = math.log
lg = math.log2
deg = math.degrees
rad = math.radians

# List/String Transformers
len_ = len
left = lambda iterable, length=0: iterable[:length] if length >= 0 else iterable
right = lambda iterable, length=0: iterable[-length:] if length > 0 else iterable
index_of = lambda iterable, value: iterable.index(value) if value in iterable else -1
reverse_ = reverse

# Collection Transformers
sort = lambda iterable, key_name='id', default_value=None: (
    ''.join(sorted(iterable)) if isinstance(iterable, str)
    else sorted(iterable) if isinstance(iterable, list)
    else sort_by(iterable, lambda x: pydash_get(x, key_name, default_value)) if isinstance(iterable, dict)
    else iterable
)
lookup = pydash_find
repeat = lambda quantity, sample: times(quantity, lambda _: sample)
substr = lambda s, start, end=None: s[start:end]
filter_by = lambda collection, prop, value: pick(collection, lambda v: pydash_get(v, prop) == value)
pluck = lambda collection, prop: pydash_pluck(
    list(collection.values()) if isinstance(collection, dict) else collection, prop
)

__all__ = [
    'add', 'diff', 'mult', 'div', 'pow_', 'inc', 'dec', 'neg', 'inv',
    'mod', 'trunc', 'ceil', 'round__', 'sin', 'cos', 'sqrt',
    'log', 'ln', 'lg', 'deg', 'rad',
    'len_', 'left', 'right', 'index_of', 'reverse_',
    'sort', 'lookup', 'repeat', 'substr', 'filter_by', 'pluck',
]
