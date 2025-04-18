import pytest
import random

from src.python.string_transformers import (
    substr, len_, left, right, index_of, concat, sample, shuffle,
    pad_left, pad_right, reverse
)

# --- Test substr ---
def test_substr_valid():
    assert substr("abcdef", 1, 4) == "bcd"
    assert substr("abcdef", 3) == "def"
    assert substr("abcdef", 0, 3) == "abc"
    assert substr("abcdef", 4, 6) == "ef"
    assert substr("abcdef", 6) == ""

def test_substr_indices_out_of_bounds():
    assert substr("abc", 5) == ""
    assert substr("abc", 1, 10) == "bc"
    assert substr("abc", -1, 2) == "ab"
    assert substr("abc", 0, -1) == "ab"

def test_substr_empty_string():
    assert substr("", 0, 1) == ""
    assert substr("", 1) == ""

def test_substr_invalid_types():
    with pytest.raises(TypeError):
        substr("abc", 'a') # type: ignore
    with pytest.raises(TypeError):
        substr("abc", 1, 'b') # type: ignore

# --- Test len_ ---
def test_len_string():
    assert len_("hello") == 5
    assert len_("") == 0
    assert len_(" ") == 1

# --- Test left ---
def test_left_string_valid():
    assert left("abcdef", 3) == "abc"
    assert left("ab", 1) == "a"
    assert left("abc", 5) == "abc"

def test_left_string_zero_length():
    assert left("abc", 0) == ""
    assert left("", 0) == ""

def test_left_string_empty():
    assert left("", 3) == ""

def test_left_string_invalid_length():
    with pytest.raises(ValueError, match="Length must be a non-negative integer"):
        left("abc", -1)

# --- Test right ---
def test_right_string_valid():
    assert right("abcdef", 3) == "def"
    assert right("ab", 1) == "b"
    assert right("abc", 5) == "abc"

def test_right_string_zero_length():
    assert right("abc", 0) == ""
    assert right("", 0) == ""

def test_right_string_empty():
    assert right("", 3) == ""

def test_right_string_invalid_length():
    with pytest.raises(ValueError, match="Length must be a non-negative integer"):
        right("abc", -1)

# --- Test index_of ---
def test_index_of_string_found():
    assert index_of("hello world", "world") == 6
    assert index_of("banana", "na") == 2
    assert index_of("aaaa", "a") == 0
    assert index_of("test", "test") == 0
    assert index_of("test", "") == 0

def test_index_of_string_not_found():
    assert index_of("hello", "world") == -1
    assert index_of("test", "a") == -1
    assert index_of("", "a") == -1

# --- Test concat ---
def test_concat_strings():
    assert concat("a", "b", "c") == "abc"
    assert concat("hello", " ", "world") == "hello world"
    assert concat("test", "") == "test"
    assert concat("") == ""

def test_concat_single_string():
    assert concat("hello") == "hello"

def test_concat_no_strings():
    assert concat() == ""

def test_concat_invalid_args():
    with pytest.raises(TypeError, match="All arguments to concat must be strings"):
        concat("a", 1) # type: ignore
    with pytest.raises(TypeError, match="All arguments to concat must be strings"):
        concat(['a'], "b") # type: ignore

# --- Test sample ---
def test_sample_string_int_count():
    data = "abcdefgh"
    result = sample(data, 4)
    assert len(result) == 4
    assert all(char in data for char in result)
    assert len(set(result)) == 4

def test_sample_string_float_percentage():
    data = "0123456789"
    result = sample(data, 0.3)
    assert len(result) == 3
    assert all(char in data for char in result)
    assert len(set(result)) == 3

def test_sample_string_count_equals_length():
    data = "abc"
    result = sample(data, 3)
    assert len(result) == 3
    assert sorted(result) == sorted(data)

def test_sample_string_count_exceeds_length():
    data = "abc"
    result = sample(data, 5)
    assert len(result) == 3
    assert sorted(result) == sorted(data)

def test_sample_string_zero_count():
    assert sample("abc", 0) == ""
    assert sample("abc", 0.0) == ""

def test_sample_empty_string():
    assert sample("", 3) == ""
    assert sample("", 0.5) == ""

def test_sample_string_invalid_count():
    with pytest.raises(ValueError, match="Sample count cannot be negative"):
        sample("ab", -1)
    with pytest.raises(ValueError, match="Sample percentage must be between 0.0 and 1.0"):
        sample("ab", 1.1)
    with pytest.raises(TypeError, match="char_count must be an integer or a float"):
        sample("ab", 'a') # type: ignore

# --- Test shuffle ---
def test_shuffle_string():
    data = "abcde"
    shuffled = shuffle(data)
    assert len(shuffled) == len(data)
    assert set(shuffled) == set(data)
    assert shuffled != data # Highly likely
    assert data == "abcde" # Original unchanged

def test_shuffle_empty_string():
    assert shuffle("") == ""

# --- Test pad_left ---
def test_pad_left_valid():
    assert pad_left("abc", 5, " ") == "  abc"
    assert pad_left("abc", 7, "xo") == "xoxoabc"
    assert pad_left("abc", 6, "xo") == "xoxabc"
    assert pad_left("abc", 3, "x") == "abc"
    assert pad_left("abc", 2, "x") == "abc"
    assert pad_left("", 3, "x") == "xxx"

def test_pad_left_invalid():
    with pytest.raises(ValueError, match="Target length must be a non-negative integer"):
        pad_left("abc", -1, "x")
    with pytest.raises(ValueError, match="Padding pattern cannot be empty"):
        pad_left("abc", 5, "")

# --- Test pad_right ---
def test_pad_right_valid():
    assert pad_right("abc", 5, " ") == "abc  "
    assert pad_right("abc", 7, "xo") == "abcxoxo"
    assert pad_right("abc", 6, "xo") == "abcxox"
    assert pad_right("abc", 3, "x") == "abc"
    assert pad_right("abc", 2, "x") == "abc"
    assert pad_right("", 3, "x") == "xxx"

def test_pad_right_invalid():
    with pytest.raises(ValueError, match="Target length must be a non-negative integer"):
        pad_right("abc", -1, "x")
    with pytest.raises(ValueError, match="Padding pattern cannot be empty"):
        pad_right("abc", 5, "")

# --- Test reverse ---
def test_reverse_string_valid():
    assert reverse("hello") == "olleh"
    assert reverse("a") == "a"
    assert reverse("madam") == "madam"

def test_reverse_string_empty():
    assert reverse("") == ""
