const defaultFork
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

// const loopFork = `
// stateDiagram-v2
// direction TB
// [*] --> LOOP_BEGIN: START_LOOP(counter)
// LOOP_BEGIN --> LOOP_REPEAT: ITERATE
// state loop_ends <<choice>>
// LOOP_REPEAT --> loop_ends: [-]
// loop_ends --> LOOP_REPEAT: isGreater($counter,0)
// loop_ends --> LOOP_END
// note right of LOOP_BEGIN
//     #{ counter } <= $counter = 1
// end note
// note left of LOOP_REPEAT
//     +ByPass
//     #{ counter } <= add(#counter, -1)
// end note
// `;

const noDefaultPathFork
= `
stateDiagram-v2
direction TB
[*] --> INIT: START (counter)
INIT --> WORKING: [-]
state isFinished <<choice>>
WORKING --> isFinished: REDUCE (value)
isFinished --> State1: isGreater($value, #counter)
isFinished --> State2: isZero($value)
ERROR --> WORKING: [-]
note right of INIT
	+ByPass
	+Init
	#{counter} <= $counter = 10
	define/isZero (v) => isEqual(v, 0)
end note
note left of WORKING
	#{counter} <= add(#counter, neg($value = 1))
end note
note right of State2
+ByPass
end note
note right of State1
	#{counter} <= 0
end note
`;

const forkIntoFork
= `
stateDiagram-v2
direction TB
[*] --> INIT: START (counter)
INIT --> WORKING: [-]
state firstCheck <<choice>>
state secondCheck <<choice>>
WORKING --> firstCheck: REDUCE (value)
firstCheck --> State1: isGreater($value, #counter)
firstCheck --> secondCheck
secondCheck --> WORKING
secondCheck --> State2: isPositive($value)
note right of INIT
	+ByPass
	+Init
	#{counter} <= $counter = 10
end note
note left of WORKING
	#{counter} <= add(#counter, neg($value = 1))
end note
note right of State1
	#{counter} <= 0
end note
`;

const multipleDefaultPathsFork
= `
stateDiagram-v2
direction TB
[*] --> INIT: START (counter)
INIT --> WORKING: [-]
state firstCheck <<choice>>
state secondCheck <<choice>>
WORKING --> firstCheck: REDUCE (value)
firstCheck --> END: isGreater($value, #counter)
firstCheck --> STOP
firstCheck --> secondCheck
secondCheck --> WORKING: isPositive($value)
secondCheck --> DEFAULT_PATH
secondCheck --> SECOND_DEFAULT_PATH
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

export default { defaultFork, noDefaultPathFork, forkIntoFork, multipleDefaultPathsFork };
