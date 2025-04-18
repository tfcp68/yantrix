import random
import math
from typing import List, Union, Optional

def substr(text: str, start: int, end: Optional[int] = None) -> str:
    """Extracts a substring. Matches Python slicing behavior.
    If end is omitted, extracts to the end of the string.
    Negative indices are not directly supported by the spec like JS substring,
    so we interpret start/end as standard Python slice indices.
    """
    if not isinstance(start, int):
        raise TypeError("Start position must be an integer")
    if end is not None and not isinstance(end, int):
         raise TypeError("End position must be an integer or None")

    if start < 0 and end is not None and end >= 0:
        start = 0

    if end is None:
        return text[start:]
    else:
        return text[start:end]

def len_(text: str) -> int:
    """Returns the number of characters in the string."""
    return len(text)

def left(text: str, length: int) -> str:
    """Returns the first 'length' characters of the string."""
    if not isinstance(length, int) or length < 0:
        raise ValueError("Length must be a non-negative integer")
    return text[:length]

def right(text: str, length: int) -> str:
    """Returns the last 'length' characters of the string."""
    if not isinstance(length, int) or length < 0:
        raise ValueError("Length must be a non-negative integer")
    if length == 0:
        return ""
    return text[-length:]

def index_of(text: str, search_substring: str) -> int:
    """Returns the index of the first occurrence of the substring, or -1 if not found."""
    return text.find(search_substring)

def concat(*strings: str) -> str:
    """Concatenates multiple strings."""
    if not all(isinstance(s, str) for s in strings):
        raise TypeError("All arguments to concat must be strings")
    return "".join(strings)

def sample(text: str, char_count: Union[int, float]) -> str:
    """Returns a string containing N random characters from the input string.
    Each character position is used at most once.

    If char_count is an integer >= 1, N is char_count.
    If char_count is a float (0.0 <= f < 1.0), N is percentage of total length, rounded down.
    """
    n = len(text)
    if isinstance(char_count, float):
        if not (0.0 <= char_count < 1.0):
            raise ValueError("Sample percentage must be between 0.0 and 1.0 (exclusive of 1.0)")
        k = math.floor(n * char_count)
    elif isinstance(char_count, int):
        if char_count < 0:
            raise ValueError("Sample count cannot be negative")
        k = char_count
    else:
        raise TypeError("char_count must be an integer or a float")

    if k < 0:
         k = 0
    if k > n:
        k = n

    indices = random.sample(range(n), k)
    return "".join(text[i] for i in sorted(indices))

def shuffle(text: str) -> str:
    """Returns a new string with the characters of the input string in a random order."""
    char_list = list(text)
    random.shuffle(char_list)
    return "".join(char_list)

def pad_left(text: str, target_length: int, pattern: str) -> str:
    """Prepends the string with the pattern repeatedly to approach target_length.
       If the original string is longer than target_length, returns it immediately.
    """
    if not isinstance(target_length, int) or target_length < 0:
        raise ValueError("Target length must be a non-negative integer")
    if not pattern:
        raise ValueError("Padding pattern cannot be empty")
    if len(text) >= target_length:
        return text

    pattern_len = len(pattern)
    needed = target_length - len(text)
    repetitions = math.ceil(needed / pattern_len)
    padding = (pattern * repetitions)[:needed]
    return padding + text

def pad_right(text: str, target_length: int, pattern: str) -> str:
    """Appends the pattern to the string repeatedly to approach target_length.
       If the original string is longer than target_length, returns it immediately.
    """
    if not isinstance(target_length, int) or target_length < 0:
        raise ValueError("Target length must be a non-negative integer")
    if not pattern:
        raise ValueError("Padding pattern cannot be empty")
    if len(text) >= target_length:
        return text

    pattern_len = len(pattern)
    needed = target_length - len(text)
    repetitions = math.ceil(needed / pattern_len)
    padding = (pattern * repetitions)[:needed]
    return text + padding

def reverse(text: str) -> str:
    """Returns a new string with the characters in reverse order."""
    return text[::-1]

STRING_TRANSFORMERS = {
    'substr': substr,
    'len': len_,
    'left': left,
    'right': right,
    'indexOf': index_of,
    'concat': concat,
    'sample': sample,
    'shuffle': shuffle,
    'padLeft': pad_left,
    'padRight': pad_right,
    'reverse': reverse,
}
