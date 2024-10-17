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

export default { defaultTemplate };
