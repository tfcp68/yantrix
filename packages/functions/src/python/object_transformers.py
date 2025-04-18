import copy
from typing import List, Any, Dict, Union, Hashable

DictObject = Dict[Hashable, Any]

def keys(obj: DictObject) -> List[Hashable]:
    """Returns a list of the object's (dictionary's) keys.
    Note: The returned keys are not sorted and no comparison between different key types is attempted.
    """
    return list(obj.keys())

def values(obj: DictObject) -> List[Any]:
    """Returns a list of the object's (dictionary's) values.
    Note: The returned values are not sorted and no comparison between different value types is attempted.
    """
    return list(obj.values())

def _safe_sort(items):
    """Helper to sort mixed types safely by converting everything to string first."""
    # We need to handle the case where None and other types need to be compared
    # by converting all items to strings first
    return sorted(items, key=lambda x: str(x) if x is not None else "")

def zip_(keys_list: List[Hashable], values_list: List[Any]) -> DictObject:
    """Creates a dictionary from a list of keys and a list of values.
       Both lists must be of equal length.
    """
    if len(keys_list) != len(values_list):
        raise ValueError("Key and value lists must be of equal length for zip")
    # Using dict comprehension for efficiency
    return {keys_list[i]: values_list[i] for i in range(len(keys_list))}

def set_attr(obj: DictObject, key: Hashable, value: Any) -> DictObject:
    """Returns a shallow copy of the dictionary with the specified key set to the new value."""
    new_obj = copy.copy(obj) # Shallow copy is usually sufficient for this type of operation
    new_obj[key] = value
    return new_obj

def unset_attr(obj: DictObject, key: Hashable) -> DictObject:
    """Returns a shallow copy of the dictionary with the specified key removed.
       If the key doesn't exist, it returns a copy without error.
    """
    new_obj = copy.copy(obj)
    new_obj.pop(key, None) # Use pop with default to avoid KeyError
    return new_obj

def merge(*objects: DictObject) -> DictObject:
    """Merges multiple dictionaries into a new one. Keys from later dictionaries overwrite earlier ones."""
    merged: DictObject = {}
    for obj in objects:
        if not isinstance(obj, dict):
            raise TypeError("All arguments to merge must be dictionaries")
        merged.update(obj) # dict.update handles the merging logic
    return merged

def intersect(*objects: DictObject) -> DictObject:
    """Creates a new dictionary containing only keys present in all input dictionaries.
       Values are taken from the last dictionary where the key appears.
    """
    if not objects:
        return {}
    if not all(isinstance(obj, dict) for obj in objects):
        raise TypeError("All arguments to intersect must be dictionaries")

    if len(objects) == 1:
        return copy.copy(objects[0]) # Intersection with self is self

    # Find the intersection of all key sets
    common_keys = set(objects[0].keys())
    for obj in objects[1:]:
        common_keys.intersection_update(obj.keys())

    # Build the result using values from the last object
    last_obj = objects[-1]
    intersection_result: DictObject = {key: last_obj[key] for key in common_keys}
    return intersection_result

def pick(source_object: DictObject, keys_or_key: Union[List[Hashable], Hashable]) -> Union[DictObject, Any, None]:
    """Picks key-value pairs from the source object or a single value.

    - If keys_or_key is a List, returns a new dictionary with pairs for existing keys.
    - If keys_or_key is a single key, returns the value associated with that key.
    Returns None if the single key is not found.
    Skips non-existent keys when picking a list of keys.
    """
    if isinstance(keys_or_key, list):
        result: DictObject = {}
        for key in keys_or_key:
            if key in source_object:
                result[key] = source_object[key]
        return result
    elif isinstance(keys_or_key, (str, int, float, bool, tuple)): # Check if it's a likely hashable key type
        key = keys_or_key
        return source_object.get(key) # Use .get() to return None if key not found
    else:
        raise TypeError("Second argument must be a hashable key or a list of hashable keys")


# Dictionary for potential dynamic lookup
OBJECT_TRANSFORMERS = {
    'keys': keys,
    'values': values,
    'zip': zip_, # Use zip_ to avoid conflict
    'setAttr': set_attr, # Note casing
    'unsetAttr': unset_attr, # Note casing
    'merge': merge,
    'intersect': intersect,
    'pick': pick,
}
