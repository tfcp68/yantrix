from .python.transformers import (
    add, diff, mult, div, pow_, inc, dec, neg, inv,
    mod, trunc, ceil, round_, sin, cos, sqrt,
    log, ln, lg, deg, rad,
    len_, left, right, index_of, shuffle, reverse,
    sort, lookup, repeat, substr, filter_by, pluck
)

from .python.conditionals import (
    _if, _case, coalesce, random
)

from .python.predicates import (
    and_, all_, or_, any_, not_, none,
    is_even, is_odd, is_integer,
    is_greater, is_greater_or_equal,
    is_less, is_less_or_equal,
    is_negative, is_positive,
    contains, has,
    is_equal, is_none
)

BUILT_IN_FUNCTIONS = {
    # Arithmetic functions
    'add': add, 'diff': diff, 'mult': mult, 'div': div,
    'pow_': pow_, 'inc': inc, 'dec': dec, 'neg': neg,
    'inv': inv, 'mod': mod, 'trunc': trunc, 'ceil': ceil,
    'round_': round_,

    # Special math functions
    'sin': sin, 'cos': cos, 'sqrt': sqrt, 'log': log,
    'ln': ln, 'lg': lg, 'deg': deg, 'rad': rad,

    # List/String transformers
    'len_': len_, 'left': left, 'right': right,
    'index_of': index_of, 'shuffle': shuffle, 'reverse': reverse,

    # Collection transformers
    'sort': sort, 'lookup': lookup, 'repeat': repeat,
    'substr': substr, 'filter_by': filter_by, 'pluck': pluck,

    # Conditionals
    '_if': _if, '_case': _case, 'coalesce': coalesce, 'random': random,

    # Predicates
    'and_': and_, 'all_': all_, 'or_': or_, 'any_': any_,
    'not_': not_, 'none': none,
    'is_even': is_even, 'is_odd': is_odd, 'is_integer': is_integer,
    'is_greater': is_greater, 'is_greater_or_equal': is_greater_or_equal,
    'is_less': is_less, 'is_less_or_equal': is_less_or_equal,
    'is_negative': is_negative, 'is_positive': is_positive,
    'contains': contains, 'has': has,
    'is_equal': is_equal, 'is_none': is_none
}

# Expose all functions directly
__all__ = list(BUILT_IN_FUNCTIONS.keys())
