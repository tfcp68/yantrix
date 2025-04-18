import pytest
import random

from src.python.list_transformers import (
    len_, lookup, left, right, first, last, index_of, concat, sample, every,
    shuffle, repeat, pick, reverse, sort_
)

# --- Test len_ ---
def test_len_list():
    assert len_([1, 2, 3]) == 3
    assert len_([]) == 0
    assert len_([None, 'a']) == 2
def test_len_tuple(): # Should work on any sequence
    assert len_((1, 2)) == 2

# --- Test lookup ---
def test_lookup_found():
    assert lookup([1, 2, 3], 2) == 2
    assert lookup(['a', 'b', 'c'], 'c') == 'c'
    assert lookup([1, 'a', None], None) is None

def test_lookup_not_found():
    assert lookup([1, 2, 3], 4) is None
    assert lookup(['a', 'b'], 'c') is None
    assert lookup([], 1) is None

# --- Test left ---
def test_left_valid():
    assert left([1, 2, 3, 4, 5], 3) == [1, 2, 3]
    assert left(['a', 'b'], 1) == ['a']
    assert left([1, 2, 3], 5) == [1, 2, 3] # Length exceeds size

def test_left_zero_length():
    assert left([1, 2, 3], 0) == []
    assert left([], 0) == []

def test_left_empty_list():
    assert left([], 3) == []

def test_left_invalid_length():
    with pytest.raises(ValueError, match="Length must be a non-negative integer"):
        left([1, 2, 3], -1)

# --- Test right ---
def test_right_valid():
    assert right([1, 2, 3, 4, 5], 3) == [3, 4, 5]
    assert right(['a', 'b'], 1) == ['b']
    assert right([1, 2, 3], 5) == [1, 2, 3] # Length exceeds size

def test_right_zero_length():
    assert right([1, 2, 3], 0) == []
    assert right([], 0) == []

def test_right_empty_list():
    assert right([], 3) == []

def test_right_invalid_length():
    with pytest.raises(ValueError, match="Length must be a non-negative integer"):
        right([1, 2, 3], -1)

# --- Test first ---
def test_first_valid():
    assert first([1, 2, 3]) == 1
    assert first(['a', 'b']) == 'a'
    assert first([None, 1]) is None

def test_first_empty():
    assert first([]) is None

# --- Test last ---
def test_last_valid():
    assert last([1, 2, 3]) == 3
    assert last(['a', 'b']) == 'b'
    assert last([1, None]) is None

def test_last_empty():
    assert last([]) is None

# --- Test index_of ---
def test_index_of_found():
    assert index_of([1, 2, 3, 2], 2) == 1 # First occurrence
    assert index_of(['a', 'b', 'c'], 'c') == 2
    assert index_of([1, None, 'a'], None) == 1

def test_index_of_not_found():
    assert index_of([1, 2, 3], 4) == -1
    assert index_of([], 'a') == -1

# --- Test concat ---
def test_concat_valid():
    assert concat([1, 2], [3, 4]) == [1, 2, 3, 4]
    assert concat(['a'], ['b', 'c'], ['d']) == ['a', 'b', 'c', 'd']
    assert concat([1], [], [2]) == [1, 2]
    assert concat([], []) == []

def test_concat_single_list():
    assert concat([1, 2, 3]) == [1, 2, 3]

def test_concat_no_lists():
    assert concat() == []

def test_concat_invalid_args():
    with pytest.raises(TypeError, match="All arguments to concat must be lists"):
        concat([1, 2], 3)
    with pytest.raises(TypeError, match="All arguments to concat must be lists"):
        concat('a', ['b'])

# --- Test sample ---
def test_sample_int_count():
    data = [1, 2, 3, 4, 5, 6]
    result = sample(data, 3)
    assert len(result) == 3
    assert all(item in data for item in result)
    assert len(set(result)) == 3 # No duplicates

def test_sample_float_percentage():
    data = list(range(20))
    result = sample(data, 0.25) # Should take floor(20 * 0.25) = 5 elements
    assert len(result) == 5
    assert all(item in data for item in result)
    assert len(set(result)) == 5

def test_sample_count_equals_length():
    data = [1, 2, 3]
    result = sample(data, 3)
    assert len(result) == 3
    assert sorted(result) == sorted(data)

def test_sample_count_exceeds_length():
    data = [1, 2, 3]
    result = sample(data, 5)
    assert len(result) == 3
    assert sorted(result) == sorted(data)

def test_sample_zero_count():
    assert sample([1, 2, 3], 0) == []
    assert sample([1, 2, 3], 0.0) == []

def test_sample_empty_list():
    assert sample([], 3) == []
    assert sample([], 0.5) == []

def test_sample_invalid_count():
    with pytest.raises(ValueError, match="Sample count cannot be negative"):
        sample([1, 2], -1)
    with pytest.raises(ValueError, match="Sample percentage must be between 0.0 and 1.0"):
        sample([1, 2], 1.1)
    with pytest.raises(ValueError, match="Sample percentage must be between 0.0 and 1.0"):
        sample([1, 2], -0.1)
    with pytest.raises(TypeError, match="item_count must be an integer or a float"):
        sample([1, 2], 'a') # type: ignore

# --- Test every ---
def test_every_valid():
    data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    assert every(data, 2) == [0, 2, 4, 6, 8] # n=2, offset=0
    assert every(data, 3) == [0, 3, 6, 9] # n=3, offset=0
    assert every(data, 3, 1) == [1, 4, 7] # n=3, offset=1
    assert every(data, 1, 5) == [5, 6, 7, 8, 9] # n=1, offset=5
    assert every(data, 5, 8) == [8]

def test_every_offset_equals_or_exceeds_length():
    assert every([1, 2, 3], 2, 3) == []
    assert every([1, 2, 3], 2, 4) == []
    assert every([], 2, 0) == []

def test_every_invalid_args():
    with pytest.raises(ValueError, match="Step \(n\) must be a positive integer"):
        every([1, 2], 0)
    with pytest.raises(ValueError, match="Step \(n\) must be a positive integer"):
        every([1, 2], -1)
    with pytest.raises(ValueError, match="Offset must be a non-negative integer"):
        every([1, 2], 2, -1)

# --- Test shuffle ---
def test_shuffle():
    # Seed random for predictability in testing (optional)
    # random.seed(42)
    data = [1, 2, 3, 4, 5]
    shuffled = shuffle(data)
    assert len(shuffled) == len(data)
    assert set(shuffled) == set(data)
    assert shuffled != data # Highly likely, though technically possible to shuffle to same order
    # Ensure original list is not modified
    assert data == [1, 2, 3, 4, 5]

def test_shuffle_empty():
    assert shuffle([]) == []

# --- Test repeat ---
def test_repeat_valid():
    assert repeat(3, 'a') == ['a', 'a', 'a']
    assert repeat(2, [1, 2]) == [[1, 2], [1, 2]] # Repeats the item itself
    assert repeat(1, None) == [None]

def test_repeat_zero_quantity():
    assert repeat(0, 'a') == []

def test_repeat_invalid_quantity():
    with pytest.raises(ValueError, match="Quantity must be a non-negative integer"):
        repeat(-1, 'a')

# --- Test pick ---
def test_pick_list_of_indices():
    data = ['a', 'b', 'c', 'd', 'e']
    assert pick(data, [0, 2, 4]) == ['a', 'c', 'e']
    assert pick(data, [3, 1]) == ['d', 'b'] # Order depends on input list
    assert pick(data, []) == []

def test_pick_single_index():
    data = ['a', 'b', 'c', 'd', 'e']
    assert pick(data, 0) == 'a'
    assert pick(data, 4) == 'e'
    assert pick(data, -1) == 'e' # Python allows negative indexing
    assert pick(data, -5) == 'a'

def test_pick_out_of_bounds_list():
    data = ['a', 'b']
    with pytest.raises(IndexError, match="Index 2 out of bounds"):
        pick(data, [0, 2])
    with pytest.raises(IndexError, match="Index -3 out of bounds"):
        pick(data, [0, -3])

def test_pick_out_of_bounds_single():
    data = ['a', 'b']
    with pytest.raises(IndexError, match="Index 2 out of bounds"):
        pick(data, 2)
    with pytest.raises(IndexError, match="Index -3 out of bounds"):
        pick(data, -3)

def test_pick_empty_list():
     with pytest.raises(IndexError):
         pick([], 0)
     assert pick([], []) == []

def test_pick_invalid_type():
    with pytest.raises(TypeError, match="Second argument must be an integer index or a list"):
        pick([1, 2], 'a') # type: ignore
    with pytest.raises(TypeError, match="Second argument must be an integer index or a list"):
        pick([1, 2], [0, 'a']) # type: ignore

# --- Test reverse ---
def test_reverse_valid():
    assert reverse([1, 2, 3, 4]) == [4, 3, 2, 1]
    assert reverse(['a', 'b']) == ['b', 'a']
    assert reverse([1]) == [1]

def test_reverse_empty():
    assert reverse([]) == []

# --- Test sort_ ---
def test_sort_numbers():
    assert sort_([3, 1, 4, 1, 5, 9, 2]) == [1, 1, 2, 3, 4, 5, 9]
    assert sort_([5.5, 2.1, 8.9]) == [2.1, 5.5, 8.9]

def test_sort_strings():
    assert sort_(['c', 'a', 'b']) == ['a', 'b', 'c']

def test_sort_mixed_comparable():
    # Be careful with mixed types - relies on Python's sorting
    # Typically raises TypeError in Python 3 unless types are implicitly comparable
    # For Yantrix, maybe assume comparable types if no error expected?
    pass # Add specific cases if needed, e.g. sort_([Decimal(1), 2.0, 3])

def test_sort_empty():
    assert sort_([]) == []

def test_sort_unsortable():
    with pytest.raises(TypeError):
        sort_([3, 'a', 1])
    with pytest.raises(TypeError):
        sort_([None, 1])
