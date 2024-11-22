const defaultTemplate
= `
stateDiagram-v2
direction TB
[*] --> INIT: START (counter)
INIT --> WORKING: [-]
state isFinished <<choice>>
WORKING --> isFinished: REDUCE (value)
isFinished --> END: isGreater($value, #counter)
isFinished --> WORKING
note right of INIT
    +ByPass
    +Init
    #{counter} <= $counter = 10
end note
note left of WORKING
    #{counter} <= add(#counter, neg($value = 1))
end note
note right of END
    #{counter} <= 0
end note
`;

const basicEvents = `
stateDiagram-v2
direction TB
[*] --> INIT: START (counter)
INIT --> WORKING: [-]
state isFinished <<choice>>
WORKING --> isFinished: REDUCE (value)
isFinished --> END: isGreater($value, #counter)
isFinished --> WORKING
note right of INIT
    +ByPass
    +Init
    #{counter} <= $counter = 10
    emit/message
    emit/specialEvent (#item1, #item2)
end note
note left of WORKING
    #{counter} <= add(#counter, neg($value = 1))
    subscribe/someEvent ACTION
end note
note right of END
    #{counter} <= 0
end note
`;

const basicSubscribe = `
stateDiagram-v2
direction TB
[*] --> INIT
INIT --> EVENT_RECEIVED: RESPOND_TO_EVENT
EVENT_RECEIVED --> END: END_ACTION
note right of INIT
+Init
subscribe/specialEvent RESPOND_TO_EVENT
end note
`;

const basicEmit = `
stateDiagram-v2
direction TB
[*] --> INIT
INIT --> EMIT_TRIGGER: RESPOND_TO_EVENT
EMIT_TRIGGER --> END: END_ACTION
note right of INIT
+Init
subscribe/eventFromBus RESPOND_TO_EVENT
end note
note right of EMIT_TRIGGER
emit/specialEvent
end note
`;

const emitWithMeta = `
stateDiagram-v2
direction TB
[*] --> INIT: RESET
INIT --> EMIT_TRIGGER: RESPOND_TO_EVENT
EMIT_TRIGGER --> END: END_ACTION
note right of INIT
+Init
subscribe/eventFromBus RESPOND_TO_EVENT
end note
note right of EMIT_TRIGGER
emit/specialEvent ($meta1=10, $meta2='string')
end note
`;

const subscribeWithMeta = `
stateDiagram-v2
direction TB
[*] --> INIT
INIT --> EVENT_RECEIVED: MOVE
EVENT_RECEIVED --> END: END_ACTION
note right of INIT
+Init
subscribe/specialEvent MOVE ($payloadValue1, $payloadValue2) <= ($meta1, $meta2)
end note
note right of EVENT_RECEIVED
#{contextValue1, contextValue2} <= $payloadValue1, $payloadValue2
end note
`;

const emitWithMetaFromContext = `
stateDiagram-v2
direction TB
[*] --> INIT: RESET
INIT --> EMIT_TRIGGER: RESPOND_TO_EVENT
EMIT_TRIGGER --> END: END_ACTION
note right of INIT
+Init
subscribe/eventFromBus RESPOND_TO_EVENT
#{contextValue1=10, contextValue2='string'}
end note
note right of EMIT_TRIGGER
emit/specialEvent ($meta1, $meta2) <= #{contextValue1, contextValue2}
end note
`;

const emitWithMetaFromContextWithDefaultValue = `
stateDiagram-v2
direction TB
[*] --> INIT: RESET
INIT --> EMIT_TRIGGER: MOVE
EMIT_TRIGGER --> END: END_ACTION
note right of INIT
+Init
#{contextValue1=10, contextValue2='string'}
end note
note right of EMIT_TRIGGER
emit/specialEvent ($meta1, $meta2, $meta3='defaultValue') <= #{contextValue1, contextValue2}
end note
`;

const wrongEventEmit = `
stateDiagram-v2
direction TB
[*] --> INIT
INIT --> EMIT_TRIGGER: RESPOND_TO_EVENT
EMIT_TRIGGER --> END: END_ACTION
note right of INIT
+Init
subscribe/eventFromBus RESPOND_TO_EVENT
end note
note right of EMIT_TRIGGER
emit/newEvent
end note
`;

const selfSubscribeAndEmit = `
stateDiagram-v2
direction TB
[*] --> INIT
INIT --> EMIT_TRIGGER: RESPOND_TO_EVENT
EMIT_TRIGGER --> STATE_AFTER_EMIT_TRIGGER: RESPOND_TO_EVENT
STATE_AFTER_EMIT_TRIGGER --> END: END_ACTION
note right of INIT
+Init
subscribe/eventFromBus RESPOND_TO_EVENT
subscribe/eventFromSelf RESPOND_TO_EVENT
end note
note right of EMIT_TRIGGER
emit/eventFromSelf ($meta1=10, $meta2='string')
end note
`;

const generateDiagramWithCustomEventNames = (names: string[]) => {
	const eventStrings = [];
	for (let i = 0; i < names.length; i++) {
		const eventName = names[i];
		eventStrings.push(Math.random() > 0.5 ? `emit/${eventName}` : `subscribe/${eventName} ACTION`);
	}
	return `
    stateDiagram-v2
    direction TB
    [*] --> INIT
    INIT --> EVENT_RECEIVED: ACTION
    EVENT_RECEIVED --> END: END_ACTION
    note right of INIT
    +Init
    ${eventStrings.join('\n')}
    end note
    `;
};

export default {
	defaultTemplate,
	basicEvents,
	basicSubscribe,
	basicEmit,
	selfSubscribeAndEmit,
	wrongEventEmit,
	emitWithMeta,
	emitWithMetaFromContext,
	emitWithMetaFromContextWithDefaultValue,
	subscribeWithMeta,
	generateDiagramWithCustomEventNames,
};
