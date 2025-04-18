"""Exports built-in Yantrix functions implemented in Python."""

from .python.arithmetic import ARITHMETIC_FUNCTIONS
from .python.special_math import SPECIAL_MATH_FUNCTIONS
from .python.statistics import STATISTICS_FUNCTIONS
from .python.list_transformers import LIST_TRANSFORMERS
from .python.string_transformers import STRING_TRANSFORMERS
from .python.object_transformers import OBJECT_TRANSFORMERS
from .python.collection_transformers import COLLECTION_TRANSFORMERS
from .python.conditionals import CONDITIONAL_FUNCTIONS
from .python.predicates import PREDICATE_FUNCTIONS

# Combine all function dictionaries into a single master dictionary
# This allows looking up any built-in function by its name.
BUILT_IN_FUNCTIONS = {
    **ARITHMETIC_FUNCTIONS,
    **SPECIAL_MATH_FUNCTIONS,
    **STATISTICS_FUNCTIONS,
    **LIST_TRANSFORMERS,
    **STRING_TRANSFORMERS,
    **OBJECT_TRANSFORMERS,
    **COLLECTION_TRANSFORMERS,
    **CONDITIONAL_FUNCTIONS,
    **PREDICATE_FUNCTIONS,
}

# Expose individual functions or categories if needed, e.g.:
# from .python.arithmetic import add, mult
# from .python.predicates import is_even, contains

__all__ = [
    'ARITHMETIC_FUNCTIONS',
    'SPECIAL_MATH_FUNCTIONS',
    'STATISTICS_FUNCTIONS',
    'LIST_TRANSFORMERS',
    'STRING_TRANSFORMERS',
    'OBJECT_TRANSFORMERS',
    'COLLECTION_TRANSFORMERS',
    'CONDITIONAL_FUNCTIONS',
    'PREDICATE_FUNCTIONS',
    'BUILT_IN_FUNCTIONS',
    # Add individual function names here if you want them directly importable
    # e.g., 'add', 'is_even' after importing them above
]
