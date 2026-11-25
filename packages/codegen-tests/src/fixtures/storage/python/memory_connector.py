class MemoryStorage:
    def __init__(self, bucket, key):
        self.bucket = bucket
        self.id = key

    def load(self):
        return self.bucket.get(self.id)

    def save(self, snapshot):
        self.bucket[self.id] = snapshot

    def clear(self):
        self.bucket.pop(self.id, None)


def connect(bucket, key):
    return MemoryStorage(bucket, key)
