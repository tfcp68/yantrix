import pytest
from decimal import Decimal

from src.python.predicates import (
    and_, or_, not_, none_,
    is_even, is_odd, is_integer, is_equal, is_greater, is_greater_or_equal,
    is_less, is_less_or_equal, is_negative, is_positive,
    contains, has, is_null
)

# --- Binary Predicates ---
def test_and_():
    assert and_(True, True, 1, [1]) is True
    assert and_(True, False, True) is False
    assert and_(True) is True
    assert and_() is True # all([]) is True

def test_or_():
    assert or_(False, False, 0, '') is False
    assert or_(False, True, False) is True
    assert or_(False) is False
    assert or_() is False # any([]) is False

def test_not_():
    assert not_(True) is False
    assert not_(False) is True
    assert not_(0) is True
    assert not_([1]) is False

def test_none_():
    assert none_(False, 0, '', []) is True
    assert none_(False, True, False) is False
    assert none_(False) is True
    assert none_() is True # not any([]) is True

# --- Numeric Predicates ---
def test_is_even():
    assert is_even(2) is True
    assert is_even(0) is True
    assert is_even(-4) is True
    assert is_even(3) is False
    assert is_even(-1) is False
    assert is_even(2.0) is True
    assert is_even(Decimal('4.0')) is True
    assert is_even(2.1) is False
    assert is_even(Decimal('4.1')) is False

def test_is_odd():
    assert is_odd(3) is True
    assert is_odd(-1) is True
    assert is_odd(2) is False
    assert is_odd(0) is False
    assert is_odd(-4) is False
    assert is_odd(3.0) is True
    assert is_odd(Decimal('5.0')) is True
    assert is_odd(3.1) is False
    assert is_odd(Decimal('5.1')) is False

def test_is_integer():
    assert is_integer(5) is True
    assert is_integer(0) is True
    assert is_integer(-10) is True
    assert is_integer(5.0) is True
    assert is_integer(Decimal('5.0')) is True
    assert is_integer(5.1) is False
    assert is_integer(Decimal('5.1')) is False
    assert is_integer('5') is False
    assert is_integer(None) is False

def test_is_equal():
    assert is_equal(5, 5) is True
    assert is_equal(5.0, 5) is True # Python's == allows this
    assert is_equal(Decimal('5.0'), 5) is True
    assert is_equal('a', 'a') is True
    assert is_equal(None, None) is True
    assert is_equal([1], [1]) is True
    assert is_equal(5, 6) is False
    assert is_equal(5, '5') is False
    assert is_equal([1], (1,)) is False # Different types
    assert is_equal(0, False) is True # Note: 0 == False in Python
    assert is_equal(1, True) is True  # Note: 1 == True in Python

def test_is_greater():
    assert is_greater(10, 5) is True
    assert is_greater(5.1, 5) is True
    assert is_greater(Decimal('6'), 5.9) is True
    assert is_greater(5, 5) is False
    assert is_greater(4, 5) is False
    with pytest.raises(TypeError):
        is_greater(10, '5') # type: ignore

def test_is_greater_or_equal():
    assert is_greater_or_equal(10, 5) is True
    assert is_greater_or_equal(5, 5) is True
    assert is_greater_or_equal(5.0, 5) is True
    assert is_greater_or_equal(Decimal('5'), 5) is True
    assert is_greater_or_equal(4.9, 5) is False
    with pytest.raises(TypeError):
        is_greater_or_equal(10, None) # type: ignore

def test_is_less():
    assert is_less(5, 10) is True
    assert is_less(-1, 0) is True
    assert is_less(4.9, 5) is True
    assert is_less(Decimal('4.9'), 5) is True
    assert is_less(5, 5) is False
    assert is_less(6, 5) is False
    with pytest.raises(TypeError):
        is_less('5', 10) # type: ignore

def test_is_less_or_equal():
    assert is_less_or_equal(5, 10) is True
    assert is_less_or_equal(5, 5) is True
    assert is_less_or_equal(5.0, 5) is True
    assert is_less_or_equal(Decimal('5'), 5) is True
    assert is_less_or_equal(5.1, 5) is False
    with pytest.raises(TypeError):
        is_less_or_equal(None, 5) # type: ignore

def test_is_negative():
    assert is_negative(-5) is True
    assert is_negative(-0.1) is True
    assert is_negative(Decimal('-0.001')) is True
    assert is_negative(0) is False
    assert is_negative(5) is False

def test_is_positive():
    assert is_positive(5) is True
    assert is_positive(0) is True # Spec implies >= 0
    assert is_positive(0.0) is True
    assert is_positive(Decimal('0.1')) is True
    assert is_positive(-0.1) is False
    assert is_positive(-5) is False

# --- Lookup Predicates ---

def test_contains_string():
    assert contains("hello world", "world") is True
    assert contains("hello world", "lo w") is True
    assert contains("hello", "a") is False
    assert contains("", "a") is False
    assert contains("abc", "") is True # Empty string is contained
    assert contains("abc", 123) is False # Value must be string

def test_contains_list():
    assert contains([1, 2, 3], 2) is True
    assert contains(['a', 'b', None], None) is True
    assert contains([1, 2, 3], 4) is False
    assert contains([], 1) is False

def test_contains_dict_key_check():
    # Spec implies key check for dicts: "value with a name of the String parameter"
    d = {'a': 1, 'b': 2, 10: 3}
    assert contains(d, 'a') is True
    assert contains(d, 10) is True
    assert contains(d, 'c') is False
    assert contains(d, 1) is False # Checks for key, not value
    assert contains(d, None) is False
    assert contains({}, 'a') is False
    # Check non-hashable value doesn't raise error
    assert contains(d, []) is False

def test_contains_other_sequence():
    assert contains((1, 2, 3), 2) is True # Tuple
    assert contains((1, 2, 3), 4) is False

def test_contains_unsupported_container():
    assert contains(123, 1) is False
    assert contains(None, None) is False

def test_has_list_index():
    lst = ['a', 'b', 'c']
    assert has(lst, 0) is True
    assert has(lst, 2) is True
    assert has(lst, 3) is False
    assert has(lst, -1) is False # has() checks non-negative index in bounds
    assert has([], 0) is False
    assert has(lst, 'a') is False # Index must be int

def test_has_dict_key():
    d = {'a': 1, 'b': 2, 10: 3}
    assert has(d, 'a') is True
    assert has(d, 10) is True
    assert has(d, 'c') is False
    assert has({}, 'a') is False
    # Check non-hashable value doesn't raise error
    assert has(d, []) is False

def test_has_other_sequence_index():
    assert has((1, 2), 1) is True
    assert has((1, 2), 2) is False

def test_has_unsupported_container():
    assert has("abc", 1) is False # String not supported by this definition of has
    assert has(123, 0) is False

def test_is_null():
    assert is_null(None) is True
    assert is_null(0) is False
    assert is_null(False) is False
    assert is_null('') is False
    assert is_null([]) is False
