---
title: Side Effects
---

# Side Effects

`Effects` are pure functions that take `Data Model` and `Event Meta` as parameters and return updated `Data Model`. Every `FSM` is locked onto oneself and cannot directly update the "outer world data" that is expressed by `Data Model`. To do so, `Effects` are invoked by `Event Stack` every time it repeats its cycle.

While every `FSM` can declare its own `Effects`, in fact they are invoked all at once, when (if) all `FSM`s have been already done with their `Reducer` loops and some `Events` have been emitted by `Event Adapters`. Only the emitted `Events` would be translated to `Effects`.

```
effect/<EFFECT_NAME> [<= (<META_KEY_LIST>)]
```
