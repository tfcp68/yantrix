---
title: Subscribing to Events
---

# Subscribing to Events

`Subscribe` statements are written using established Yantrix subsyntax. They have the following forms:
```
subscribe/<EVENT_NAME> <ACTION_NAME>
subscribe/<EVENT_NAME> <ACTION_NAME> (<PAYLOAD_KEY_LIST>)
subscribe/<EVENT_NAME> <ACTION_NAME> (<PAYLOAD_KEY_LIST>) <= (<META_KEY_LIST>)
```
In the generated code, each statement will be translated to the corresponding `listener` for the `Event Adapter` of the machine.
It's important to remember that while `Subscribe` statements are written in `notes` attached to `State` nodes, subscription to events is not dependent on the current state of the automata.
After catching some emitted event, `Event Adapter` will translate it to a corresponding `Action` that can be immediately dispatched to the automata.

`Event` naming follows the established standards for `States` and `Actions`.
