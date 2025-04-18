import pytest
import random
from decimal import Decimal

from src.python.conditionals import (
    if_, case, coalesce, random_
)

# --- Test if_ ---
def test_if_true_condition():
    assert if_(True, 'yes', 'no') == 'yes'
    assert if_(1, 10, 20) == 10
    assert if_([1], 'list', 'empty') == 'list'
    assert if_('hello', True, False) is True

def test_if_false_condition():
    assert if_(False, 'yes', 'no') == 'no'
    assert if_(0, 10, 20) == 20
    assert if_([], 'list', 'empty') == 'empty'
    assert if_('', True, False) is False
    assert if_(None, 'some', 'none') == 'none'

# --- Test case ---
def test_case_first_match():
    assert case(False, 1, True, 2, True, 3) == 2

def test_case_second_match():
    assert case(False, 1, False, 2, True, 3) == 3

def test_case_no_match_with_else():
    assert case(False, 1, 0, 2, 'else_value') == 'else_value'

def test_case_no_match_no_else():
    assert case(False, 1, 0, 2) is None

def test_case_only_else():
    assert case('only_else') == 'only_else'

def test_case_empty_args():
    assert case() is None

def test_case_truthy_conditions():
    assert case(1 > 0, 'positive', 1 < 0, 'negative', 'zero') == 'positive'
    assert case([], 'empty', [1], 'not empty', 'other') == 'not empty'

# --- Test coalesce ---
def test_coalesce_first_non_none():
    assert coalesce(None, 'hello', 'world') == 'hello'
    assert coalesce(None, None, 123, None, 456) == 123
    assert coalesce(False, 'found') is False # False is not None
    assert coalesce(0, 'found') == 0 # 0 is not None

def test_coalesce_only_none():
    assert coalesce(None, None, None) is None

def test_coalesce_single_arg():
    assert coalesce('hello') == 'hello'
    assert coalesce(None) is None

def test_coalesce_no_args():
    assert coalesce() is None

# --- Test random_ ---
def test_random_no_args():
    for _ in range(10):
        val = random_()
        assert isinstance(val, float)
        assert 0.0 <= val < 1.0

def test_random_two_args_int():
    min_val, max_val = 5, 10
    for _ in range(10):
        val = random_(min_val, max_val)
        assert isinstance(val, float)
        assert min_val <= val <= max_val

def test_random_two_args_float():
    min_val, max_val = 1.5, 3.5
    for _ in range(10):
        val = random_(min_val, max_val)
        assert isinstance(val, float)
        assert min_val <= val <= max_val

def test_random_two_args_decimal():
    min_val, max_val = Decimal('-1.0'), Decimal('1.0')
    for _ in range(10):
        val = random_(min_val, max_val)
        assert isinstance(val, float) # random.uniform returns float
        assert float(min_val) <= val <= float(max_val)

def test_random_two_args_reversed():
    min_val, max_val = 10, 5
    for _ in range(10):
        val = random_(min_val, max_val)
        assert isinstance(val, float)
        assert 5 <= val <= 10 # Should still work

def test_random_invalid_args_count():
    with pytest.raises(TypeError, match="random expected 0 or 2 arguments"):
        random_(5) # type: ignore
    with pytest.raises(TypeError, match="random expected 0 or 2 arguments"):
        random_(1, 2, 3) # type: ignore
