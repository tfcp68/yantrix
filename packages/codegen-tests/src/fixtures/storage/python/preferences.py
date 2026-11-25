class PreferenceMapper:
    def __init__(self, field):
        self.field = field

    def select(self, model):
        return model[self.field]

    def hydrate(self, model, snapshot):
        return {**model, self.field: snapshot}


preferences_mapper = PreferenceMapper("theme")
