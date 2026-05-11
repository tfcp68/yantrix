
class _EventBus:
    def __init__(self):
        self._subs = {}
        self._stack = []
        self._processing = False

    def subscribe(self, event_id, handler):
        self._subs.setdefault(event_id, []).append(handler)

    def unsubscribe(self, event_id, handler):
        if event_id in self._subs:
            self._subs[event_id] = [h for h in self._subs[event_id] if h is not handler]

    def dispatch(self, *events):
        self._stack.extend(events)
        if not self._processing:
            self._processing = True
            try:
                while self._stack:
                    ev = self._stack.pop(0)
                    for h in list(self._subs.get(ev.get('event'), [])):
                        h(ev)
            finally:
                self._processing = False


class _EventAdapter:
    def __init__(self):
        self._emitters = {}
        self._listeners = {}

    def add_event_emitter(self, state_value, fn):
        self._emitters[state_value] = fn

    def add_event_listener(self, event_id, fn):
        self._listeners.setdefault(event_id, []).append(fn)

    def handle_event(self, event_meta):
        actions = []
        for fn in self._listeners.get(event_meta.get('event'), []):
            result = fn(event_meta)
            if result:
                actions.append(result)
        return actions

    def handle_transition(self, context):
        fn = self._emitters.get(context.get('state'))
        if fn:
            result = fn(context)
            if result:
                return [result] if isinstance(result, dict) else list(result)
        return []
