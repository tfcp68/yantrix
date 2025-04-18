import pytest
import copy

from src.python.collection_transformers import (
    filter_by, omit, find, pluck, sort_
)

COLL1 = [
    {'id': 1, 'name': 'Alice', 'group': 'A', 'score': 80},
    {'id': 2, 'name': 'Bob', 'group': 'B', 'score': 95},
    {'id': 3, 'name': 'Charlie', 'group': 'A', 'score': 80},
    {'id': 4, 'name': 'David', 'group': 'C'}, # Missing score
]

COLL_MIXED = [
    {'id': 1, 'val': 10},
    {'id': 2, 'val': None},
    {'id': 3},
    {'id': 4, 'val': 10},
    {'id': 5, 'val': 5},
]

COLL_EMPTY = []

# --- Test filter_by ---
def test_filter_by_found():
    result = filter_by(COLL1, 'group', 'A')
    assert result == [
        {'id': 1, 'name': 'Alice', 'group': 'A', 'score': 80},
        {'id': 3, 'name': 'Charlie', 'group': 'A', 'score': 80},
    ]
    result_score = filter_by(COLL1, 'score', 80)
    assert result_score == [
        {'id': 1, 'name': 'Alice', 'group': 'A', 'score': 80},
        {'id': 3, 'name': 'Charlie', 'group': 'A', 'score': 80},
    ]

def test_filter_by_not_found():
    assert filter_by(COLL1, 'group', 'D') == []
    assert filter_by(COLL1, 'score', 100) == []
    assert filter_by(COLL1, 'non_existent_prop', 'A') == []

def test_filter_by_empty_collection():
    assert filter_by(COLL_EMPTY, 'group', 'A') == []

def test_filter_by_non_dict_items():
    coll_with_non_dict = COLL1 + [1, None, 'str']
    result = filter_by(coll_with_non_dict, 'group', 'A')
    # Non-dicts are just skipped
    assert result == [
        {'id': 1, 'name': 'Alice', 'group': 'A', 'score': 80},
        {'id': 3, 'name': 'Charlie', 'group': 'A', 'score': 80},
    ]

def test_filter_by_invalid_collection_type():
    with pytest.raises(TypeError, match="First argument must be a list"):
        filter_by({'a': 1}, 'a', 1) # type: ignore

# --- Test omit ---
def test_omit_found():
    result = omit(COLL1, 'group', 'A')
    assert result == [
        {'id': 2, 'name': 'Bob', 'group': 'B', 'score': 95},
        {'id': 4, 'name': 'David', 'group': 'C'},
    ]
    result_score = omit(COLL1, 'score', 80)
    assert result_score == [
        {'id': 2, 'name': 'Bob', 'group': 'B', 'score': 95},
        {'id': 4, 'name': 'David', 'group': 'C'},
    ]

def test_omit_not_found():
    assert omit(COLL1, 'group', 'D') == COLL1
    assert omit(COLL1, 'score', 100) == COLL1
    assert omit(COLL1, 'non_existent_prop', 'A') == COLL1

def test_omit_empty_collection():
    assert omit(COLL_EMPTY, 'group', 'A') == []

def test_omit_non_dict_items():
    coll_with_non_dict = COLL1 + [1, None, 'str']
    result = omit(coll_with_non_dict, 'group', 'A')
    assert result == [
        {'id': 2, 'name': 'Bob', 'group': 'B', 'score': 95},
        {'id': 4, 'name': 'David', 'group': 'C'},
        1,
        None,
        'str',
    ]

def test_omit_invalid_collection_type():
    with pytest.raises(TypeError, match="First argument must be a list"):
        omit({'a': 1}, 'a', 1) # type: ignore

# --- Test find ---
def test_find_found():
    assert find(COLL1, 'id', 2) == {'id': 2, 'name': 'Bob', 'group': 'B', 'score': 95}
    assert find(COLL1, 'score', 80) == {'id': 1, 'name': 'Alice', 'group': 'A', 'score': 80}

def test_find_not_found():
    assert find(COLL1, 'id', 5) is None
    assert find(COLL1, 'group', 'D') is None
    assert find(COLL1, 'non_existent_prop', 'val') is None

def test_find_empty_collection():
    assert find(COLL_EMPTY, 'id', 1) is None

def test_find_non_dict_items():
    coll_with_non_dict = [1, {'id': 1}, None, {'id': 2}, 'str']
    assert find(coll_with_non_dict, 'id', 1) == {'id': 1}
    assert find(coll_with_non_dict, 'id', 2) == {'id': 2}
    assert find(coll_with_non_dict, 'id', 3) is None

def test_find_invalid_collection_type():
    with pytest.raises(TypeError, match="First argument must be a list"):
        find({'a': 1}, 'a', 1) # type: ignore

# --- Test pluck ---
def test_pluck_found():
    assert pluck(COLL1, 'name') == ['Alice', 'Bob', 'Charlie', 'David']
    assert pluck(COLL1, 'score') == [80, 95, 80, None] # Missing treated as None

def test_pluck_missing_property():
    assert pluck(COLL1, 'city') == [None, None, None, None]

def test_pluck_empty_collection():
    assert pluck(COLL_EMPTY, 'name') == []

def test_pluck_non_dict_items():
    coll_with_non_dict = [1, {'id': 1, 'name': 'A'}, None, {'id': 2}, 'str']
    assert pluck(coll_with_non_dict, 'name') == [None, 'A', None, None, None]
    assert pluck(coll_with_non_dict, 'id') == [None, 1, None, 2, None]

def test_pluck_invalid_collection_type():
     with pytest.raises(TypeError, match="First argument must be a list"):
        pluck({'a': 1}, 'a') # type: ignore

# --- Test sort_ ---
def test_sort_by_id_default():
    # Default key is 'id'
    original_coll = copy.deepcopy(COLL_MIXED)
    result = sort_(COLL_MIXED)
    assert result == [
        {'id': 1, 'val': 10},
        {'id': 2, 'val': None},
        {'id': 3},
        {'id': 4, 'val': 10},
        {'id': 5, 'val': 5},
    ]
    # Check original not modified
    assert COLL_MIXED == original_coll
    # Check it's a copy
    assert result is not COLL_MIXED

def test_sort_by_name():
    result = sort_(COLL1, key_name='name')
    assert result == [
        {'id': 1, 'name': 'Alice', 'group': 'A', 'score': 80},
        {'id': 2, 'name': 'Bob', 'group': 'B', 'score': 95},
        {'id': 3, 'name': 'Charlie', 'group': 'A', 'score': 80},
        {'id': 4, 'name': 'David', 'group': 'C'}, # David comes last
    ]

def test_sort_by_score_with_default():
    result = sort_(COLL1, key_name='score', default_value=0)
    assert result == [
        {'id': 4, 'name': 'David', 'group': 'C'}, # score=0 (default)
        {'id': 1, 'name': 'Alice', 'group': 'A', 'score': 80},
        {'id': 3, 'name': 'Charlie', 'group': 'A', 'score': 80},
        {'id': 2, 'name': 'Bob', 'group': 'B', 'score': 95},
    ]

def test_sort_empty_collection():
    assert sort_([]) == []
    assert sort_([], key_name='name') == []

def test_sort_non_dict_items():
    coll_with_non_dict = [1, {'id': 1}, None, {'id': 2}, 'str']
    with pytest.raises(TypeError):
         sort_(coll_with_non_dict, key_name='id')

    # Using default_value=0, should work if items are comparable to 0 (int is, None/str are not)
    with pytest.raises(TypeError):
        sort_(coll_with_non_dict, key_name='id', default_value=0)

def test_sort_non_comparable_values():
    coll = [{'id': 1, 'val': 10}, {'id': 2, 'val': 'a'}]
    with pytest.raises(TypeError, match="not comparable"):
        sort_(coll, key_name='val')

def test_sort_non_comparable_default():
    coll = [{'id': 1}, {'id': 2, 'val': 10}]
    with pytest.raises(TypeError, match="not comparable"):
        # Trying to compare 10 with default_value=None
        sort_(coll, key_name='val')

def test_sort_invalid_collection_type():
    with pytest.raises(TypeError, match="First argument must be a list"):
        sort_({'a': 1}) # type: ignore
