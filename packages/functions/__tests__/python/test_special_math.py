import pytest
import math
from decimal import Decimal

from src.python.special_math import (
    sin, cos, sqrt, log, ln, lg, deg, rad
)

# --- Test sin ---
def test_sin():
    assert sin(0) == 0.0
    assert sin(math.pi / 2) == pytest.approx(1.0)
    assert sin(math.pi) == pytest.approx(0.0)
    assert sin(3 * math.pi / 2) == pytest.approx(-1.0)
    assert sin(Decimal(str(math.pi / 2))) == pytest.approx(1.0)

# --- Test cos ---
def test_cos():
    assert cos(0) == 1.0
    assert cos(math.pi / 2) == pytest.approx(0.0)
    assert cos(math.pi) == pytest.approx(-1.0)
    assert cos(3 * math.pi / 2) == pytest.approx(0.0)
    assert cos(Decimal('0')) == pytest.approx(1.0)

# --- Test sqrt ---
def test_sqrt_positive():
    assert sqrt(4) == 2.0
    assert sqrt(9) == 3.0
    assert sqrt(2) == pytest.approx(math.sqrt(2))
    assert sqrt(Decimal('16')) == 4.0
    assert sqrt(2.25) == 1.5

def test_sqrt_zero():
    assert sqrt(0) == 0.0
    assert sqrt(Decimal('0')) == 0.0

def test_sqrt_negative():
    with pytest.raises(ValueError, match="Cannot calculate square root of a negative number"):
        sqrt(-4)
    with pytest.raises(ValueError, match="Cannot calculate square root of a negative number"):
        sqrt(Decimal('-1'))

# --- Test log ---
def test_log_valid():
    assert log(100, 10) == pytest.approx(2.0)
    assert log(8, 2) == pytest.approx(3.0)
    assert log(Decimal('1000'), 10) == pytest.approx(3.0)
    assert log(10, Decimal('2')) == pytest.approx(math.log(10, 2))
    assert log(math.e, math.e) == pytest.approx(1.0)

def test_log_invalid_number():
    with pytest.raises(ValueError, match="Logarithm requires positive number"):
        log(0, 10)
    with pytest.raises(ValueError, match="Logarithm requires positive number"):
        log(-10, 10)

def test_log_invalid_base():
    with pytest.raises(ValueError, match="positive base != 1"):
        log(10, 1)
    with pytest.raises(ValueError, match="positive base != 1"):
        log(10, 0)
    with pytest.raises(ValueError, match="positive base != 1"):
        log(10, -2)

# --- Test ln ---
def test_ln_valid():
    assert ln(math.e) == pytest.approx(1.0)
    assert ln(1) == 0.0
    assert ln(Decimal(str(math.e**2))) == pytest.approx(2.0)

def test_ln_invalid():
    with pytest.raises(ValueError, match="Natural logarithm requires positive number"):
        ln(0)
    with pytest.raises(ValueError, match="Natural logarithm requires positive number"):
        ln(-1)

# --- Test lg ---
def test_lg_valid():
    assert lg(100) == pytest.approx(2.0)
    assert lg(1) == 0.0
    assert lg(0.1) == pytest.approx(-1.0)
    assert lg(Decimal('1000')) == pytest.approx(3.0)

def test_lg_invalid():
    with pytest.raises(ValueError, match="Base-10 logarithm requires positive number"):
        lg(0)
    with pytest.raises(ValueError, match="Base-10 logarithm requires positive number"):
        lg(-10)

# --- Test deg (degrees to radians) ---
def test_deg():
    assert deg(0) == 0.0
    assert deg(90) == pytest.approx(math.pi / 2)
    assert deg(180) == pytest.approx(math.pi)
    assert deg(Decimal('270')) == pytest.approx(3 * math.pi / 2)
    assert deg(-90) == pytest.approx(-math.pi / 2)

# --- Test rad (radians to degrees) ---
def test_rad():
    assert rad(0) == 0.0
    assert rad(math.pi / 2) == pytest.approx(90.0)
    assert rad(math.pi) == pytest.approx(180.0)
    assert rad(Decimal(str(3 * math.pi / 2))) == pytest.approx(270.0)
    assert rad(-math.pi / 2) == pytest.approx(-90.0)
