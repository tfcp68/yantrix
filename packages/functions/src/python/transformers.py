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
