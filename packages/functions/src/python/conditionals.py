from typing import Any, List, Optional, Tuple, Union, TypeVar
import random as _random_stdlib

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
