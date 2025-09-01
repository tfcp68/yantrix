from typing import Any, List, Optional, Tuple, Union, TypeVar
from pydash import find, is_boolean, is_number, is_none, is_list, get
import random

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
    random.randint(min_, max_ - 1) if min_ is not None and max_ is not None
    else random.randint(0, 1)
)

__all__ = ['_case', 'coalesce', '_if', 'random']
