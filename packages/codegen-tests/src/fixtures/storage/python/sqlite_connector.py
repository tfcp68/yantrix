class SQLiteStorage:
    def __init__(self, database, key):
        self.database = database
        self.id = key
        self.database.execute("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)")

    def load(self):
        row = self.database.execute("SELECT value FROM settings WHERE key = ?", (self.id,)).fetchone()
        return row[0] if row else None

    def save(self, snapshot):
        with self.database:
            self.database.execute("INSERT OR REPLACE INTO settings VALUES (?, ?)", (self.id, snapshot))

    def clear(self):
        with self.database:
            self.database.execute("DELETE FROM settings WHERE key = ?", (self.id,))


def connect(database, key):
    return SQLiteStorage(database, key)
