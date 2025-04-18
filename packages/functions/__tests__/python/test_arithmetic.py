import pytest
from decimal import Decimal, getcontext

# Set precision for Decimal tests if needed
# getcontext().prec = 28

from src.python.arithmetic import (
    add, diff, mult, div, pow_, inc, dec, neg, inv, mod, trunc, ceil, round_
)

# --- Test add ---
def test_add_integers():
    assert add(1, 2, 3) == 6
    assert add(-1, -2, -3) == -6
    assert add(1, -2, 3) == 2
    assert add(0, 0) == 0

def test_add_floats():
    assert add(1.5, 2.5) == 4.0
    assert add(-1.5, 2.0) == 0.5
    assert add(0.1, 0.2) == pytest.approx(0.3) # Use approx for float comparisons

def test_add_decimals():
    assert add(Decimal('1.1'), Decimal('2.2')) == Decimal('3.3')
    assert add(Decimal('-0.1'), Decimal('0.2')) == Decimal('0.1')

def test_add_mixed_types():
    assert add(1, 2.5) == 3.5
    assert add(1, Decimal('2.5')) == Decimal('3.5')
    assert add(1.5, Decimal('2')) == Decimal('3.5')
    assert add(1, 2.0, Decimal('3.5')) == Decimal('6.5')

def test_add_no_args():
    assert add() == 0

def test_add_single_arg():
    assert add(5) == 5
    assert add(Decimal('5.5')) == Decimal('5.5')

# --- Test diff ---
def test_diff_integers():
    assert diff(5, 10) == 5
    assert diff(10, 5) == -5
    assert diff(-5, -10) == -5
    assert diff(-5, 5) == 10

def test_diff_floats():
    assert diff(1.5, 4.0) == 2.5
    assert diff(4.0, 1.5) == -2.5

def test_diff_decimals():
    assert diff(Decimal('1.1'), Decimal('3.3')) == Decimal('2.2')
    assert diff(Decimal('3.3'), Decimal('1.1')) == Decimal('-2.2')

def test_diff_mixed_types():
     assert diff(2, 5.5) == 3.5
     assert diff(5.5, 2) == -3.5
     assert diff(Decimal('2'), 5.5) == Decimal('3.5')
     assert diff(5.5, Decimal('2')) == Decimal('-3.5')

# --- Test mult ---
def test_mult_integers():
    assert mult(2, 3, 4) == 24
    assert mult(-2, 3, 4) == -24
    assert mult(-2, -3, 4) == 24
    assert mult(2, 3, 0) == 0

def test_mult_floats():
    assert mult(1.5, 2.0) == 3.0
    assert mult(0.5, 0.5) == 0.25
    assert mult(-1.0, 5.5) == -5.5

def test_mult_decimals():
    assert mult(Decimal('1.1'), Decimal('2.0')) == Decimal('2.2')
    assert mult(Decimal('0.5'), Decimal('0.5')) == Decimal('0.25')

def test_mult_mixed_types():
    assert mult(2, 1.5) == 3.0
    assert mult(2, Decimal('1.5')) == Decimal('3.0')
    assert mult(1.5, Decimal('2')) == Decimal('3.0')
    assert mult(2, 0.5, Decimal('3.0')) == Decimal('3.0')

def test_mult_no_args():
    assert mult() == 1

def test_mult_single_arg():
    assert mult(5) == 5
    assert mult(Decimal('-2.5')) == Decimal('-2.5')

# --- Test div ---
def test_div_integers():
    assert div(10, 2) == 5.0
    assert div(5, 2) == 2.5
    assert div(-10, 2) == -5.0
    assert div(10, -2) == -5.0

def test_div_floats():
    assert div(5.0, 2.0) == 2.5
    assert div(1.0, 0.5) == 2.0

def test_div_decimals():
    assert div(Decimal('5'), Decimal('2')) == Decimal('2.5')
    assert div(Decimal('1.0'), Decimal('0.5')) == Decimal('2.0')

def test_div_mixed_types():
    assert div(5, 2.0) == 2.5
    assert div(5.0, 2) == 2.5
    assert div(Decimal('5'), 2) == Decimal('2.5')
    assert div(5, Decimal('2')) == Decimal('2.5')

def test_div_by_zero():
    with pytest.raises(ValueError, match="Division by zero"):
        div(10, 0)
    with pytest.raises(ValueError, match="Division by zero"):
        div(Decimal('10'), 0)
    with pytest.raises(ValueError, match="Division by zero"):
        div(10, Decimal('0'))

# --- Test pow_ ---
def test_pow_integers():
    assert pow_(2, 3) == 8
    assert pow_(3, 0) == 1
    assert pow_(-2, 2) == 4
    assert pow_(-2, 3) == -8
    assert pow_(10, -1) == 0.1

def test_pow_floats():
    assert pow_(2.0, 3.0) == 8.0
    assert pow_(4.0, 0.5) == 2.0
    assert pow_(2.5, 2.0) == 6.25

def test_pow_decimals():
    assert pow_(Decimal('2'), Decimal('3')) == Decimal('8')
    assert pow_(Decimal('4'), Decimal('0.5')) == Decimal('2')
    assert pow_(Decimal('2.5'), Decimal('2')) == Decimal('6.25')

def test_pow_mixed_types():
    assert pow_(2, 1.5) == pytest.approx(2.8284271247)
    assert pow_(2.0, 3) == 8.0
    assert pow_(Decimal('2'), 3) == Decimal('8')
    assert pow_(2, Decimal('3')) == Decimal('8')

# --- Test inc ---
def test_inc():
    assert inc(5) == 6
    assert inc(-1) == 0
    assert inc(1.5) == 2.5
    assert inc(Decimal('1.1')) == Decimal('2.1')

# --- Test dec ---
def test_dec():
    assert dec(5) == 4
    assert dec(0) == -1
    assert dec(1.5) == 0.5
    assert dec(Decimal('1.1')) == Decimal('0.1')

# --- Test neg ---
def test_neg():
    assert neg(5) == -5
    assert neg(-5) == 5
    assert neg(0) == 0
    assert neg(1.5) == -1.5
    assert neg(Decimal('-1.1')) == Decimal('1.1')

# --- Test inv ---
def test_inv():
    assert inv(2) == 0.5
    assert inv(4) == 0.25
    assert inv(-2) == -0.5
    assert inv(0.5) == 2.0
    assert inv(Decimal('2')) == Decimal('0.5')
    assert inv(Decimal('0.5')) == Decimal('2.0')

def test_inv_by_zero():
    with pytest.raises(ValueError, match="Division by zero"):
        inv(0)
    with pytest.raises(ValueError, match="Division by zero"):
        inv(Decimal('0'))

# --- Test mod ---
def test_mod_integers():
    assert mod(10, 3) == 1
    assert mod(10, -3) == -2
    assert mod(-10, 3) == 2
    assert mod(-10, -3) == -1
    assert mod(5, 5) == 0

def test_mod_floats():
    assert mod(10.5, 3.0) == pytest.approx(1.5)
    assert mod(5.0, 2.5) == pytest.approx(0.0)
    assert mod(-10.5, 3.0) == pytest.approx(1.5)

def test_mod_decimals():
    assert mod(Decimal('10.5'), Decimal('3')) == Decimal('1.5')
    assert mod(Decimal('5.0'), Decimal('2.5')) == Decimal('0.0')
    assert mod(Decimal('-10.5'), Decimal('3')) == Decimal('1.5')

def test_mod_by_zero():
    with pytest.raises(ValueError, match="Modulo by zero"):
        mod(10, 0)
    with pytest.raises(ValueError, match="Modulo by zero"):
        mod(Decimal('10'), 0)

# --- Test trunc ---
def test_trunc():
    assert trunc(3.7) == 3
    assert trunc(-3.7) == -3
    assert trunc(3.0) == 3
    assert trunc(Decimal('3.7')) == 3
    assert trunc(Decimal('-3.7')) == -3

# --- Test ceil ---
def test_ceil():
    assert ceil(3.7) == 4
    assert ceil(-3.7) == -3
    assert ceil(3.0) == 3
    assert ceil(Decimal('3.7')) == 4
    assert ceil(Decimal('-3.7')) == -3

# --- Test round_ ---
def test_round_default_precision():
    assert round_(3.7) == 4
    assert round_(3.2) == 3
    assert round_(3.5) == 4
    assert round_(-3.7) == -4
    assert round_(-3.2) == -3
    assert round_(-3.5) == -4
    assert isinstance(round_(3.2), int)

def test_round_with_precision():
    assert round_(3.14159, 2) == 3.14
    assert round_(3.14159, 0) == 3.0
    assert round_(3.14159, 4) == 3.1416
    assert round_(2.5, 0) == 2.0
    assert round_(3.5, 0) == 4.0
    assert isinstance(round_(3.14, 1), float)

def test_round_decimal():
    assert round_(Decimal('3.14159'), 2) == Decimal('3.14')
    assert round_(Decimal('3.14159'), 0) == Decimal('3')
    assert round_(Decimal('3.14159'), 4) == Decimal('3.1416')
    assert round_(Decimal('2.5'), 0) == Decimal('3')
    assert round_(Decimal('3.5'), 0) == Decimal('4')
    assert round_(Decimal('3.125'), 2) == Decimal('3.13')

def test_round_negative_precision():
     with pytest.raises(ValueError, match="Precision must be a non-negative integer"):
        round_(123.45, -1)

def test_round_non_integer_precision():
     with pytest.raises(ValueError, match="Precision must be a non-negative integer"):
        round_(123.45, 1.5)
