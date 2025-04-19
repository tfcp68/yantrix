from typing import List, Any, Dict, Hashable, Optional
import operator # For sorting

Collection = List[Dict[Hashable, Any]]
DictObject = Dict[Hashable, Any]

def filter_by(collection: Collection, property_name: Hashable, seek_value: Any) -> Collection:
    """Returns a new collection containing only items where item[property_name] == seek_value.
       Items without the property_name are skipped.
    """
    if not isinstance(collection, list):
        raise TypeError("First argument must be a list (Collection)")
    return [item for item in collection if isinstance(item, dict) and item.get(property_name) == seek_value]

def omit(collection: Collection, property_name: Hashable, seek_value: Any) -> Collection:
    """Returns a new collection excluding items where item[property_name] == seek_value.
       Items without the property_name are included.
    """
    if not isinstance(collection, list):
        raise TypeError("First argument must be a list (Collection)")
    return [item for item in collection if not (isinstance(item, dict) and item.get(property_name) == seek_value)]

def find(collection: Collection, property_name: Hashable, seek_value: Any) -> Optional[DictObject]:
    """Returns the first item in the collection where item[property_name] == seek_value.
       Returns None if no match is found.
    """
    if not isinstance(collection, list):
        raise TypeError("First argument must be a list (Collection)")
    for item in collection:
        if isinstance(item, dict) and item.get(property_name) == seek_value:
            return item
    return None

def pluck(collection: Collection, property_name: Hashable) -> List[Any]:
    """Returns a list of the values of 'property_name' for each item in the collection.
       If an item doesn't have the property, its contribution is skipped (or could be None).
       Let's return None for items missing the property.
    """
    if not isinstance(collection, list):
        raise TypeError("First argument must be a list (Collection)")
    return [item.get(property_name) if isinstance(item, dict) else None for item in collection]

def sort_(collection: Collection, key_name: Hashable = 'id', default_value: Any = None) -> Collection:
    """Returns a new collection sorted ascendingly by the 'key_name' field.
       Items missing the key use 'default_value' for sorting comparison.
    """
    if not isinstance(collection, list):
        raise TypeError("First argument must be a list (Collection)")

    non_dict_items = [item for item in collection if not isinstance(item, dict)]
    if non_dict_items:
        raise TypeError("All items in collection must be dictionaries for sorting by key")

    def sort_key(item):
        return item.get(key_name, default_value)

    values = [sort_key(item) for item in collection if item.get(key_name) is not None]
    if values and default_value is not None and any(item.get(key_name) is None for item in collection):
        try:
            next(iter(values)) < default_value or default_value < next(iter(values))
        except (TypeError, ValueError):
            raise TypeError("Items not comparable with default value")

    if len(values) >= 2:
        try:
            for i in range(len(values)-1):
                if values[i] != values[i+1]:
                    values[i] < values[i+1]
                    break
        except (TypeError, ValueError):
            raise TypeError("Items not comparable with each other")

    try:
        return sorted(copy.copy(collection), key=sort_key)
    except TypeError as e:
        raise TypeError("Items not comparable")

# Need copy for sort_
import copy

COLLECTION_TRANSFORMERS = {
    'filterBy': filter_by,
    'omit': omit,
    'find': find,
    'pluck': pluck,
    'sort': sort_,
}
