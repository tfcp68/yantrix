from contextlib import closing, nullcontext
import sys

from .bindings import create_storage_bindings


def round_trip(open_backend):
    current = {"theme": "dark", "dialog_open": True}
    initial = {"theme": "light", "dialog_open": False}
    with open_backend() as backend:
        binding, = create_storage_bindings({"user-preferences": (backend, "theme-key")})
        assert binding["storage"].id == "theme-key"
        assert binding["storage"].load() is None
        binding["storage"].save(binding["select"](current))

    with open_backend() as backend:
        binding, = create_storage_bindings({"user-preferences": (backend, "theme-key")})
        storage = binding["storage"]
        assert binding["hydrate"](initial, storage.load()) == {"theme": "dark", "dialog_open": False}
        storage.clear()
        assert storage.load() is None


if sys.argv[1] == "sqlite":
    import sqlite3
    round_trip(lambda: closing(sqlite3.connect("settings.sqlite")))
else:
    bucket = {}
    round_trip(lambda: nullcontext(bucket))
