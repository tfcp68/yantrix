import random
import math
from typing import List, Any, Optional, Union, Sequence, TypeVar

T = TypeVar('T')

def len_(lst: Sequence) -> int:
    """Returns the number of items in the list (or any sequence)."""
    return len(lst)

def lookup(lst: List[T], search_element: T) -> Optional[T]:
    """Returns the search element if it's present in the list, None otherwise."""
    return search_element if search_element in lst else None

def left(lst: List[T], length: int) -> List[T]:
    """Returns the first 'length' items from the list."""
    if not isinstance(length, int) or length < 0:
        raise ValueError("Length must be a non-negative integer")
    return lst[:length]

def right(lst: List[T], length: int) -> List[T]:
    """Returns the last 'length' items from the list."""
    if not isinstance(length, int) or length < 0:
        raise ValueError("Length must be a non-negative integer")
    if length == 0:
        return []
    return lst[-length:]

def first(lst: List[T]) -> Optional[T]:
    """Returns the first element of the list, or None if empty."""
    return lst[0] if lst else None

def last(lst: List[T]) -> Optional[T]:
    """Returns the last element of the list, or None if empty."""
    return lst[-1] if lst else None

def index_of(lst: List[T], value: T) -> int:
    """Returns the zero-based index of the value, or -1 if not found."""
    try:
        return lst.index(value)
    except ValueError:
        return -1

def concat(*lists: List[T]) -> List[T]:
    """Concatenates multiple lists into a single new list."""
    new_list: List[T] = []
    for lst in lists:
        if not isinstance(lst, list):
            raise TypeError("All arguments to concat must be lists")
        new_list.extend(lst)
    return new_list

def sample(lst: List[T], item_count: Union[int, float]) -> List[T]:
    """Returns a list containing N random items from the input list without duplicates.

    If item_count is an integer >= 1, N is item_count.
    If item_count is a float (0.0 <= f < 1.0), N is percentage of total quantity, rounded down.
    """
    n = len(lst)
    if isinstance(item_count, float):
        if not (0.0 <= item_count < 1.0):
            raise ValueError("Sample percentage must be between 0.0 and 1.0 (exclusive of 1.0)")
        k = math.floor(n * item_count)
    elif isinstance(item_count, int):
        if item_count < 0:
            raise ValueError("Sample count cannot be negative")
        k = item_count
    else:
        raise TypeError("item_count must be an integer or a float")

    if k < 0:
         k = 0
    if k > n:
        k = n

    # random.sample handles k=0 and k>n correctly
    return random.sample(lst, k)

def every(lst: List[T], n: int, offset: int = 0) -> List[T]:
    """Returns a new list containing every Nth item from the input list, starting with offset."""
    if not isinstance(n, int) or n <= 0:
        raise ValueError("Step (n) must be a positive integer")
    if not isinstance(offset, int) or offset < 0:
        raise ValueError("Offset must be a non-negative integer")

    if offset >= len(lst):
        return []

    return lst[offset::n]

def shuffle(lst: List[T]) -> List[T]:
    """Returns a new list with the elements of the input list in a random order."""
    new_list = lst[:]
    random.shuffle(new_list)
    return new_list

def repeat(quantity: int, value_sample: T) -> List[T]:
    """Returns a new list containing 'quantity' replicated instances of 'value_sample'."""
    if not isinstance(quantity, int) or quantity < 0:
        raise ValueError("Quantity must be a non-negative integer")
    return [value_sample] * quantity

def pick(source_list: List[T], keys_or_index: Union[List[int], int]) -> Union[List[T], T, None]:
    """Picks elements from the source list based on indices or a single index.

    - If keys_or_index is a List[int], returns a new list with elements at those indices.
    - If keys_or_index is an int, returns the single element at that index.
    Returns None if index is out of bounds for single pick.
    Raises IndexError if any index in the list is out of bounds.
    """
    n = len(source_list)
    if isinstance(keys_or_index, list):
        result: List[T] = []
        for index in keys_or_index:
            if not isinstance(index, int):
                raise TypeError("Second argument must be an integer index or a list of integer indices")
            actual_index = index if index >= 0 else n + index
            if not (0 <= actual_index < n):
                raise IndexError(f"Index {index} out of bounds for list of length {n}")
        for index in keys_or_index:
            actual_index = index if index >= 0 else n + index
            result.append(source_list[actual_index])
        return result
    elif isinstance(keys_or_index, int):
        index = keys_or_index
        actual_index = index if index >= 0 else n + index
        if 0 <= actual_index < n:
            return source_list[actual_index]
        else:
            raise IndexError(f"Index {index} out of bounds for list of length {n}")
    else:
        raise TypeError("Second argument must be an integer index or a list of integer indices")

def reverse(lst: List[T]) -> List[T]:
    """Returns a new list with the elements in reverse order."""
    return lst[::-1]

def sort_(lst: List[Any]) -> List[Any]:
    """Returns a new list with the elements sorted in ascending order.
       Assumes elements are comparable.
    """
    return sorted(lst)

LIST_TRANSFORMERS = {
    'len': len_,
    'lookup': lookup,
    'left': left,
    'right': right,
    'first': first,
    'last': last,
    'indexOf': index_of,
    'concat': concat,
    'sample': sample,
    'every': every,
    'shuffle': shuffle,
    'repeat': repeat,
    'pick': pick,
    'reverse': reverse,
    'sort': sort_,
}
