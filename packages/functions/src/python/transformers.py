from typing import Any, List, Tuple, TypeVar, Union, Optional
from pydash import (
    add as pydash_add, subtract, multiply, divide, power as pydash_pow,
    negate, increment, decrement, ceil as pydash_ceil, round as pydash_round,
    sin as pydash_sin, cos as pydash_cos, sqrt as pydash_sqrt,
    log as pydash_log, ln as pydash_ln, lg as pydash_lg,
    degrees as pydash_deg, radians as pydash_rad,
    truncate as pydash_trunc, modulo as pydash_mod,
    filter as pydash_filter, pluck as pydash_pluck,
    get as pydash_get, map_values as pydash_map_values,
    has as pydash_has, pick as pydash_pick, find as pydash_find,
    times as pydash_times, sort_by as pydash_sort_by
)

T = TypeVar('T')

# Arithmetic Transformers
add = pydash_add
diff = subtract
mult = multiply
div = divide
pow_ = pydash_pow
inc = increment
dec = decrement
neg = negate
inv = lambda n: 1 / n if isinstance(n, (int, float)) else None
mod = pydash_mod
trunc = pydash_trunc
ceil = pydash_ceil
round_ = pydash_round

# Special Math Transformers
sin = pydash_sin
cos = pydash_cos
sqrt = pydash_sqrt
log = pydash_log
ln = pydash_ln
lg = pydash_lg
deg = pydash_deg
rad = pydash_rad

# List/String Transformers
len_ = len
left = lambda iterable, length=0: iterable[:length] if length >= 0 else iterable
right = lambda iterable, length=0: iterable[-length:] if length > 0 else iterable
index_of = lambda iterable, value: iterable.index(value) if value in iterable else -1
shuffle = pydash.shuffle
reverse = pydash.reverse

# Collection Transformers
sort = lambda iterable, key_name='id', default_value=None: (
    ''.join(sorted(iterable)) if isinstance(iterable, str)
    else sorted(iterable) if isinstance(iterable, list)
    else pydash_sort_by(iterable, lambda x: pydash_get(x, key_name, default_value))
    if isinstance(iterable, dict)
    else iterable
)
lookup = pydash_find
repeat = lambda quantity, sample: pydash_times(quantity, lambda: sample)
substr = lambda str_, start, end=None: str_[start:end]
filter_by = lambda collection, prop, value: pydash_pick(collection, lambda v: pydash_get(v, prop) == value)
pluck = lambda collection, prop: pydash_pluck(collection.values(), prop)

__all__ = [
    'add', 'diff', 'mult', 'div', 'pow_', 'inc', 'dec', 'neg', 'inv',
    'mod', 'trunc', 'ceil', 'round_', 'sin', 'cos', 'sqrt',
    'log', 'ln', 'lg', 'deg', 'rad',
    'len_', 'left', 'right', 'index_of', 'shuffle', 'reverse',
    'sort', 'lookup', 'repeat', 'substr', 'filter_by', 'pluck'
]
