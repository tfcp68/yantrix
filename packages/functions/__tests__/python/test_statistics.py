import pytest
import statistics
from decimal import Decimal

from src.python.statistics import (
    max_, min_, avg, med, sum_, sumsq, sum_product
)

# Helper to compare potentially Decimal results accurately
def assert_num_equal(a, b):
    if isinstance(a, Decimal) or isinstance(b, Decimal):
        assert Decimal(str(a)) == Decimal(str(b))
    elif isinstance(a, float) or isinstance(b, float):
        assert a == pytest.approx(b)
    else:
        assert a == b

# --- Test max_ ---
def test_max_varargs():
    assert max_(1, 5, 2, 8, 3) == 8
    assert max_(-1, -5, -2) == -1
    assert max_(1, 5, 2.5, Decimal('8.1'), 3) == Decimal('8.1')
    assert max_(10) == 10

def test_max_list():
    assert max_([1, 5, 2, 8, 3]) == 8
    assert max_([-1, -5, -2]) == -1
    assert max_([1, 5, 2.5, Decimal('8.1'), 3]) == Decimal('8.1')
    assert max_([10]) == 10

def test_max_empty():
    with pytest.raises(ValueError, match="max_.* empty sequence"):
        max_([])
    with pytest.raises(ValueError, match="max_.* empty sequence"):
        max_()

def test_max_invalid_input():
    with pytest.raises(TypeError, match="must be numeric"):
        max_(1, 2, 'a')
    with pytest.raises(TypeError, match="must be numeric"):
        max_([1, 'b'])

# --- Test min_ ---
def test_min_varargs():
    assert min_(1, 5, 2, 8, 3) == 1
    assert min_(-1, -5, -2) == -5
    assert min_(Decimal('0.9'), 5, 2.5, 8, 3) == Decimal('0.9')
    assert min_(10) == 10

def test_min_list():
    assert min_([1, 5, 2, 8, 3]) == 1
    assert min_([-1, -5, -2]) == -5
    assert min_([Decimal('0.9'), 5, 2.5, 8, 3]) == Decimal('0.9')
    assert min_([10]) == 10

def test_min_empty():
    with pytest.raises(ValueError, match="min_.* empty sequence"):
        min_([])
    with pytest.raises(ValueError, match="min_.* empty sequence"):
        min_()

def test_min_invalid_input():
     with pytest.raises(TypeError, match="must be numeric"):
        min_(1, 'a', 3)

# --- Test avg ---
def test_avg_varargs():
    assert avg(1, 2, 3, 4, 5) == 3.0
    assert avg(10) == 10.0
    assert avg(1, 2, 3) == 2.0
    assert avg(1.5, 2.5, 3.5) == pytest.approx(2.5)
    assert avg(1, 2, Decimal('3.6')) == pytest.approx(2.2) # Returns float

def test_avg_list():
    assert avg([1, 2, 3, 4, 5]) == 3.0
    assert avg([10]) == 10.0
    assert avg([1.5, 2.5, 3.5]) == pytest.approx(2.5)
    assert avg([1, 2, Decimal('3.6')]) == pytest.approx(2.2)

def test_avg_empty():
    with pytest.raises(statistics.StatisticsError, match="avg requires at least one data point"):
        avg([])
    with pytest.raises(statistics.StatisticsError, match="avg requires at least one data point"):
        avg()

def test_avg_invalid_input():
     with pytest.raises(TypeError, match="must be numeric"):
        avg(1, 2, 'c')

# --- Test med ---
def test_med_varargs_odd():
    assert med(1, 5, 2, 8, 3) == 3
    assert med(10.1, 2.5, 5.0) == 5.0
    assert med(Decimal('1'), Decimal('5'), Decimal('3')) == Decimal('3')

def test_med_varargs_even():
    # statistics.median averages the two middle elements
    assert med(1, 5, 2, 8) == pytest.approx(3.5) # (2+5)/2
    assert med(10.0, 2.0) == pytest.approx(6.0)
    assert med(Decimal('1'), Decimal('4')) == Decimal('2.5')

def test_med_list_odd():
    assert med([1, 5, 2, 8, 3]) == 3
    assert med([10.1, 2.5, 5.0]) == 5.0

def test_med_list_even():
    assert med([1, 5, 2, 8]) == pytest.approx(3.5)
    assert med([Decimal('1'), Decimal('4')]) == Decimal('2.5')

def test_med_single():
     assert med(15) == 15
     assert med([15]) == 15

def test_med_empty():
    with pytest.raises(statistics.StatisticsError, match="median requires at least one data point"):
        med([])
    with pytest.raises(statistics.StatisticsError, match="median requires at least one data point"):
        med()

def test_med_invalid_input():
     with pytest.raises(TypeError, match="must be numeric"):
        med(1, 'b', 5)

# --- Test sum_ ---
def test_sum_list():
    assert sum_([1, 2, 3, 4]) == 10
    assert sum_([1.5, 2.5]) == 4.0
    assert sum_([Decimal('1.1'), Decimal('2.2')]) == Decimal('3.3')
    assert sum_([1, 2.5, Decimal('3.5')]) == Decimal('7.0')

def test_sum_empty():
    assert sum_([]) == 0

# --- Test sumsq ---
def test_sumsq_list():
    assert sumsq([1, 2, 3]) == 14 # 1 + 4 + 9
    assert sumsq([1.5, 2.0]) == pytest.approx(6.25) # 2.25 + 4
    assert sumsq([Decimal('1'), Decimal('0.5')]) == Decimal('1.25') # 1 + 0.25
    assert sumsq([1, 1.0, Decimal('2')]) == Decimal('6.0') # 1 + 1 + 4

def test_sumsq_empty():
    assert sumsq([]) == 0

# --- Test sum_product ---
def test_sum_product_valid():
    l1 = [1, 2, 3]
    l2 = [4, 5, 6]
    assert sum_product(l1, l2) == 32 # (1*4) + (2*5) + (3*6) = 4 + 10 + 18 = 32
    l3 = [0.5, 1.0, 2.0]
    assert sum_product(l1, l2, l3) == pytest.approx(48.0) # (1*4*0.5) + (2*5*1) + (3*6*2) = 2 + 10 + 36 = 48
    d1 = [Decimal('1'), Decimal('2')]
    d2 = [Decimal('0.1'), Decimal('0.2')]
    assert sum_product(d1, d2) == Decimal('0.5') # (1*0.1) + (2*0.2) = 0.1 + 0.4 = 0.5

def test_sum_product_mixed_types():
    l1 = [1, 2]
    l2 = [1.5, 0.5]
    d3 = [Decimal('2'), Decimal('3')]
    # Result should be Decimal because d3 is Decimal
    # (1 * 1.5 * 2) + (2 * 0.5 * 3) = 3 + 3 = 6
    assert sum_product(l1, l2, d3) == Decimal('6.0')

def test_sum_product_empty_lists_input():
    assert sum_product([], []) == 0

def test_sum_product_no_lists():
     assert sum_product() == 0

def test_sum_product_single_list():
     with pytest.raises(ValueError, match="sum_product requires at least two lists"):
        sum_product([1, 2, 3])

def test_sum_product_mismatched_lengths():
     with pytest.raises(ValueError, match="All lists must have the same length"):
        sum_product([1, 2, 3], [4, 5])
