---
title: Emitting Events
---

# Emitting Events

`Emit` statements are written using established Yantrix subsyntax. They have the following forms:
```
emit/<EVENT_NAME>
emit/<EVENT_NAME> (<META_KEY_LIST>)
emit/<EVENT_NAME> (<META_KEY_LIST>) <= #{<STATE_KEY_LIST>)
```
In the generated code, each statement will be translated to the corresponding `emitter` for the `Event Adapter` of the machine.
Current state of the automata will determine, which events are going to be emitted. At any time the user will have the possibility to use automata's `Event Adapter` to obtain the list of events which can be emitted, perhaps with the help of `Event Bus` or any other construct.

`Event` naming follows the established standards for `States` and `Actions`.
