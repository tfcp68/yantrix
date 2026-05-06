import math
from typing import Any, List, Tuple, TypeVar, Union, Optional

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

__all__ = [
    'add', 'diff', 'mult', 'div', 'pow_', 'inc', 'dec', 'neg', 'inv',
    'mod', 'trunc', 'ceil', 'round_', 'sin', 'cos', 'sqrt',
    'log', 'ln', 'lg', 'deg', 'rad',
    'len_', 'left', 'right', 'index_of', 'reverse_',
    'sort', 'lookup', 'repeat', 'substr', 'filter_by', 'pluck',
]
