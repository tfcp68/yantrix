export const blankDiagram = '';

export const invalidDiagram = 'invalidDiagram';

export const emptyStateDiagram = 'stateDiagram-v2';

export const stateDiagramSimpleTransition = `
   stateDiagram-v2

   A --> B
`;

export const stateDiagramSimpleTransitionCompleted = `
   stateDiagram-v2

   [*] --> A
   A --> B
   B --> [*]
`;

export const stateDiagramSimpleTransitionWithComments = `
   stateDiagram-v2

   [*] --> A: Start
   A --> B: Transition 1
   B --> [*]: End
`;

export const stateDiagramAllStatesToEnd = `
	stateDiagram-v2

	[*] --> A
	A --> B
	A --> [*]
	B --> [*]
	[*] --> [*]
`;

export const stateDiagramWithDoubleTransitions = `
	stateDiagram-v2

	[*] --> A
	[*] --> A
	A --> B
	A --> B
	B --> [*]
	B --> [*]
`;

export const stateDiagramWithSimpleChoice = `
   stateDiagram-v2

   state ChoiceState <<choice>>

   [*] --> ChoiceState: Start
   ChoiceState --> A: Condition 1
   ChoiceState --> [*]: Condition 2
   A --> [*]
`;

export const stateDiagramWithSimpleFork = `
   stateDiagram-v2

   state Fork <<fork>>
   state Join <<join>>

   [*] --> Fork: Start
   Fork --> B: Fork 1
   Fork --> C: Fork 2
   B --> Join
   C --> Join
   Join --> [*]: End
`;

export const stateDiagramWitNormalForks = `
	stateDiagram-v2

	state Fork1 <<fork>>
	state Join1 <<join>>

	state Fork2 <<fork>>
	state Join2 <<join>>

	[*] --> Fork1: 

	Fork1 --> A: Fork A
	Fork1 --> B: Fork B
	Fork1 --> C: Fork C
	A --> Join1: Join A
	B --> Join1: Join B
	C --> Join1: Join C

	Join1 --> Fork2

	Fork2 --> X: Fork x
	Fork2 --> Y: Fork Y
	Fork2 --> Z: Fork Z
	X --> Join2: Join X
	Y --> Join2: Join y
	Z --> Join2: Join Z

	Join2 --> [*]
`;

export const stateDiagramWithLoopChoice = `
   stateDiagram-v2

   state ChoiceState1 <<choice>>
   state ChoiceState2 <<choice>>

   [*] --> A
   A --> ChoiceState1
   ChoiceState1 --> [*]: Condition 1
   ChoiceState1 --> ChoiceState2: Condition 2
   ChoiceState2 --> ChoiceState1
`;

export const stateDiagramWithOneLineNotes = `
   stateDiagram-v2

   [*] --> A
   A --> B
   B --> [*]

   note left of A: simple note left of A
   note right of B: simple note right of B
`;

export const stateDiagramWithEmptyNote = `
   stateDiagram-v2

   [*] --> A
   A --> B
   B --> [*]

   note left of A
   end note
   note right of B
   end note
`;

export const stateDiagramWithLeftSideNote = `
   stateDiagram-v2

   [*] --> A
   A --> B
   B --> [*]

   note left of A
		simple left side note
   end note
`;

export const stateDiagramWithRightSideNote = `
   stateDiagram-v2

   [*] --> A
   A --> B
   B --> [*]

   note right of A
		simple right side note
   end note
   note left of A
		another simple left side note
   end note
`;

export const stateDiagramWithMultilineNotes = `
   stateDiagram-v2

   [*] --> A
   A --> B
   B --> [*]

   note right of A
		simple right side note
		right of A that is
		longer than 1 line
   end note
   note left of A
		another note left
		of A that contains
		more than 1 line
   end note
`;

export const stateDiagramWithChoiceAndNote = `
   stateDiagram-v2

   state A <<choice>>

   [*] --> A
   A --> B
   A --> C
   C --> [*]
   B --> [*]

   note right of A
		simple right side note
   end note
   note left of A
		another simple left side note
		in 2 lines
   end note
`;

export const stateDiagramWithSameAction = `
   stateDiagram-v2

   [*] --> A: Transition
   A --> B: Transition
   A --> C
   C --> [*]
   B --> [*]
`;

export const stateDiagramWithNamedStates = `
   stateDiagram-v2

   state "Lesha" as A

   [*] --> A
   A --> B
   B --> [*]
`;

export const stateDiagramDoublePath = `
   stateDiagram-v2

   state ChoiceState1 <<choice>>
   state ChoiceState2 <<choice>>

   [*] --> A
   A --> ChoiceState1
   ChoiceState1 --> ChoiceState2: predicate1($value)
   ChoiceState1 --> B
   ChoiceState2 --> D: predicate2($value)
   ChoiceState2 --> B
   B --> [*]
   D --> [*]

   note left of ChoiceState1
		this is multiline
		comment left of
		first choice
   end note

   note right of ChoiceState2
		this is another
		multiline comment
		right of second choice
   end note
`;
