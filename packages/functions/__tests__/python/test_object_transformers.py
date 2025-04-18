import pytest
import copy

from src.python.object_transformers import (
    keys, values, zip_, set_attr, unset_attr, merge, intersect, pick, _safe_sort
)

OBJ1 = {'a': 1, 'b': 2, 'c': 3}
OBJ2 = {'b': 20, 'd': 40}
OBJ3 = {'a': 100, 'c': 300, 'e': 500}
EMPTY_OBJ = {}

# --- Test keys ---
def test_keys_valid():
    assert _safe_sort(keys(OBJ1)) == _safe_sort(['a', 'b', 'c'])
    assert _safe_sort(keys({'x': None, 1: 'a'})) == _safe_sort(['x', 1])

def test_keys_empty():
    assert keys(EMPTY_OBJ) == []

# --- Test values ---
def test_values_valid():
    assert _safe_sort(values(OBJ1)) == _safe_sort([1, 2, 3])
    assert _safe_sort(values({'x': None, 1: 'a'})) == _safe_sort([None, 'a'])

def test_values_empty():
    assert values(EMPTY_OBJ) == []

# --- Test zip_ ---
def test_zip_valid():
    keys_list = ['name', 'age', 'city']
    values_list = ['Alice', 30, 'New York']
    expected = {'name': 'Alice', 'age': 30, 'city': 'New York'}
    assert zip_(keys_list, values_list) == expected

def test_zip_empty():
    assert zip_([], []) == {}

def test_zip_mismatched_lengths():
    with pytest.raises(ValueError, match="Key and value lists must be of equal length"):
        zip_(['a', 'b'], [1])
    with pytest.raises(ValueError, match="Key and value lists must be of equal length"):
        zip_(['a'], [1, 2])

# --- Test set_attr ---
def test_set_attr_add_new():
    original = {'a': 1}
    result = set_attr(original, 'b', 2)
    assert result == {'a': 1, 'b': 2}
    assert original == {'a': 1}
    assert result is not original

def test_set_attr_overwrite():
    original = {'a': 1, 'b': 2}
    result = set_attr(original, 'a', 10)
    assert result == {'a': 10, 'b': 2}
    assert original == {'a': 1, 'b': 2}

def test_set_attr_on_empty():
    result = set_attr({}, 'a', 1)
    assert result == {'a': 1}

# --- Test unset_attr ---
def test_unset_attr_existing():
    original = {'a': 1, 'b': 2, 'c': 3}
    result = unset_attr(original, 'b')
    assert result == {'a': 1, 'c': 3}
    assert original == {'a': 1, 'b': 2, 'c': 3}
    assert result is not original

def test_unset_attr_non_existing():
    original = {'a': 1, 'c': 3}
    result = unset_attr(original, 'b')
    assert result == {'a': 1, 'c': 3}
    assert result is not original

def test_unset_attr_on_empty():
    result = unset_attr({}, 'a')
    assert result == {}

# --- Test merge ---
def test_merge_two_objects():
    result = merge(OBJ1, OBJ2)
    assert result == {'a': 1, 'b': 20, 'c': 3, 'd': 40}
    assert OBJ1 == {'a': 1, 'b': 2, 'c': 3}
    assert OBJ2 == {'b': 20, 'd': 40}

def test_merge_three_objects():
    result = merge(OBJ1, OBJ2, OBJ3)
    assert result == {'a': 100, 'b': 20, 'c': 300, 'd': 40, 'e': 500}

def test_merge_with_empty():
    assert merge(OBJ1, EMPTY_OBJ) == OBJ1
    assert merge(EMPTY_OBJ, OBJ1) == OBJ1
    assert merge(EMPTY_OBJ, EMPTY_OBJ) == EMPTY_OBJ

def test_merge_single_object():
    result = merge(OBJ1)
    assert result == OBJ1
    assert result is not OBJ1

def test_merge_no_objects():
    assert merge() == {}

def test_merge_invalid_args():
    with pytest.raises(TypeError, match="All arguments to merge must be dictionaries"):
        merge(OBJ1, [1, 2]) # type: ignore
    with pytest.raises(TypeError, match="All arguments to merge must be dictionaries"):
        merge('a', OBJ2) # type: ignore

# --- Test intersect ---
def test_intersect_two_objects():
    result = intersect(OBJ1, OBJ2) #
    assert result == {'b': 20}

def test_intersect_three_objects():
    o1 = {'a': 1, 'b': 2, 'c': 3}
    o2 = {'b': 20, 'c': 30, 'd': 40}
    o3 = {'c': 300, 'd': 400, 'e': 500}
    result = intersect(o1, o2, o3)
    assert result == {'c': 300}

def test_intersect_no_common_keys():
    assert intersect(OBJ1, {'x': 10, 'y': 20}) == {}

def test_intersect_with_self():
    result = intersect(OBJ1, OBJ1)
    assert result == OBJ1
    assert result is not OBJ1

def test_intersect_with_empty():
    assert intersect(OBJ1, EMPTY_OBJ) == {}
    assert intersect(EMPTY_OBJ, OBJ1) == {}
    assert intersect(EMPTY_OBJ, EMPTY_OBJ) == {}

def test_intersect_single_object():
    result = intersect(OBJ1)
    assert result == OBJ1
    assert result is not OBJ1

def test_intersect_no_objects():
    assert intersect() == {}

def test_intersect_invalid_args():
    with pytest.raises(TypeError, match="All arguments to intersect must be dictionaries"):
        intersect(OBJ1, [1, 2]) # type: ignore

# --- Test pick ---
def test_pick_list_of_keys():
    assert pick(OBJ1, ['a', 'c']) == {'a': 1, 'c': 3}
    assert pick(OBJ1, ['c', 'a']) == {'c': 3, 'a': 1}
    assert pick(OBJ1, ['a', 'x']) == {'a': 1}
    assert pick(OBJ1, []) == {}
    assert pick(EMPTY_OBJ, ['a']) == {}

def test_pick_single_key():
    assert pick(OBJ1, 'a') == 1
    assert pick(OBJ1, 'b') == 2
    assert pick(OBJ1, 'x') is None
    assert pick(EMPTY_OBJ, 'a') is None

def test_pick_invalid_type():
    with pytest.raises(TypeError, match="Second argument must be a hashable key or a list"):
        pick(OBJ1, {'a': 1}) # type: ignore
