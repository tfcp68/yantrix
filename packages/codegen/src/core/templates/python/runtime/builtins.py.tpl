# --- Python builtins (auto-generated from @yantrix/functions/src/python/) ---

from typing import Any, List, Optional, Tuple, Union, TypeVar
import random as _random_stdlib
from typing import Any, List, Union, TypeVar
import math
from typing import Any, List, Tuple, TypeVar, Union, Optional


T = TypeVar('T')
A = TypeVar('A')

TCasePair = Tuple[bool, T]
TNestedArray = List[Union['TCasePair[T]', List['TCasePair[T]']]]


def _deep_get(obj, path, default=None):
    if not isinstance(path, str):
        return obj.get(path, default) if isinstance(obj, dict) else default
    curr = obj
    for key in str(path).split('.'):
        if not isinstance(curr, dict):
            return default
        curr = curr.get(key, default)
    return curr


def _deep_has(obj, path):
    _sentinel = object()
    return _deep_get(obj, path, _sentinel) is not _sentinel


def _flatten_pairs(input_):
    if not isinstance(input_, list):
        return []
    result = []
    for item in input_:
        if isinstance(item, list) and len(item) == 2 and isinstance(item[0], bool):
            result.append(item)
        elif isinstance(item, list):
            result.extend(_flatten_pairs(item))
    return result


# @@begin: _if
_if = lambda condition, true_value, false_value: true_value if condition else false_value
# @@end: _if

# @@begin: _case
def _case(*args):
    if len(args) >= 2 and isinstance(args[0], bool):
        return args[1] if args[0] else (args[2] if len(args) > 2 else None)
    if len(args) == 1 and isinstance(args[0], list):
        pairs = _flatten_pairs(args[0])
        return next((p[1] for p in pairs if p[0]), None)
    if len(args) == 2 and isinstance(args[0], list):
        pairs = _flatten_pairs(args[0])
        return next((p[1] for p in pairs if p[0]), args[1])
    return None
# @@end: _case

# @@begin: coalesce
coalesce = lambda *values: next((v for v in values if v is not None), None)
# @@end: coalesce

# @@begin: random
random = lambda min_=None, max_=None: (
    _random_stdlib.randint(min_, max_ - 1) if min_ is not None and max_ is not None
    else _random_stdlib.randint(0, 1)
)
# @@end: random

# @@begin: _random
_random = _random_stdlib.random
# @@end: _random

__all__ = ['_case', 'coalesce', '_if', 'random', '_random']


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


T = TypeVar('T')

# @@begin: add
add = lambda a, b: a + b
# @@end: add

# @@begin: diff
diff = lambda a, b: a - b
# @@end: diff

# @@begin: mult
mult = lambda a, b: a * b
# @@end: mult

# @@begin: div
div = lambda a, b: a / b if b != 0 else None
# @@end: div

# @@begin: pow_
pow_ = lambda a, b: a ** b
# @@end: pow_

# @@begin: inc
inc = lambda n: n + 1 if isinstance(n, (int, float)) else None
# @@end: inc

# @@begin: dec
dec = lambda n: n - 1 if isinstance(n, (int, float)) else None
# @@end: dec

# @@begin: neg
neg = lambda n: -n if isinstance(n, (int, float)) else None
# @@end: neg

# @@begin: inv
inv = lambda n: 1 / n if isinstance(n, (int, float)) and n != 0 else None
# @@end: inv

# @@begin: mod
mod = lambda a, b: a % b if b != 0 else None
# @@end: mod

# @@begin: trunc
trunc = math.trunc
# @@end: trunc

# @@begin: ceil
ceil = math.ceil
# @@end: ceil

# @@begin: round_
round_ = round
# @@end: round_

# @@begin: sin
sin = math.sin
# @@end: sin

# @@begin: cos
cos = math.cos
# @@end: cos

# @@begin: sqrt
sqrt = math.sqrt
# @@end: sqrt

# @@begin: log
log = lambda x, base=None: math.log(x, base) if base is not None else math.log(x)
# @@end: log

# @@begin: ln
ln = math.log
# @@end: ln

# @@begin: lg
lg = math.log2
# @@end: lg

# @@begin: deg
deg = math.degrees
# @@end: deg

# @@begin: rad
rad = math.radians
# @@end: rad

# @@begin: len_
len_ = len
# @@end: len_

# @@begin: left
left = lambda iterable, length=0: iterable[:length] if length >= 0 else iterable
# @@end: left

# @@begin: right
right = lambda iterable, length=0: iterable[-length:] if length > 0 else iterable
# @@end: right

# @@begin: index_of
index_of = lambda iterable, value: iterable.index(value) if value in iterable else -1
# @@end: index_of

# @@begin: reverse_
reverse_ = lambda lst: lst[::-1]
# @@end: reverse_

# @@begin: sort
sort = lambda iterable, key_name='id', default_value=None: (
    ''.join(sorted(iterable)) if isinstance(iterable, str)
    else sorted(iterable) if isinstance(iterable, list)
    else dict(sorted(
        iterable.items(),
        key=lambda x: x[1].get(key_name, default_value) if isinstance(x[1], dict) else x[1]
    )) if isinstance(iterable, dict)
    else iterable
)
# @@end: sort

# @@begin: lookup
lookup = lambda collection, predicate: next(
    (item for item in (collection.values() if isinstance(collection, dict) else collection) if predicate(item)),
    None
)
# @@end: lookup

# @@begin: repeat
repeat = lambda quantity, sample: [sample for _ in range(quantity)]
# @@end: repeat

# @@begin: substr
substr = lambda s, start, end=None: s[start:end]
# @@end: substr

# @@begin: filter_by
filter_by = lambda collection, prop, value: (
    {k: v for k, v in collection.items() if isinstance(v, dict) and v.get(prop) == value}
    if isinstance(collection, dict)
    else [item for item in collection if isinstance(item, dict) and item.get(prop) == value]
)
# @@end: filter_by

# @@begin: pluck
pluck = lambda collection, prop: [
    item.get(prop)
    for item in (collection.values() if isinstance(collection, dict) else collection)
    if isinstance(item, dict)
]
# @@end: pluck

# @@begin: find
find = lambda collection, prop, value: next(
    (item for item in (collection.values() if isinstance(collection, dict) else collection)
     if isinstance(item, dict) and item.get(prop) == value),
    None
)
# @@end: find

# @@begin: sample
def sample(iterable, n):
    if isinstance(iterable, str):
        chars = list(iterable)
        return ''.join(_random_stdlib.sample(chars, min(n, len(chars))))
    items = list(iterable)
    return _random_stdlib.sample(items, min(n, len(items)))
# @@end: sample

__all__ = [
    'add', 'diff', 'mult', 'div', 'pow_', 'inc', 'dec', 'neg', 'inv',
    'mod', 'trunc', 'ceil', 'round_', 'sin', 'cos', 'sqrt',
    'log', 'ln', 'lg', 'deg', 'rad',
    'len_', 'left', 'right', 'index_of', 'reverse_',
    'sort', 'lookup', 'repeat', 'substr', 'filter_by', 'pluck',
    'find', 'sample',
]
