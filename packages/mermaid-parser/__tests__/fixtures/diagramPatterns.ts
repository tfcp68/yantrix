export const blankInput = '';

export const invalidDiagram = 'invalidDiagram';

export const emptyStateDiagram = 'stateDiagram-v2';

export const simpleTransition = `
   stateDiagram-v2

   A --> B
`;

export const simpleTransitionCompleted = `
   stateDiagram-v2

   [*] --> A
   A --> B
   B --> [*]
`;

export const simpleTransitionWithComments = `
   stateDiagram-v2

   [*] --> A: Start
   A --> B: Transition 1
   B --> [*]: End
`;

export const stateDiagramWithChoice = `
   stateDiagram-v2

   state A <<choice>>

   [*] --> A: Start
   A --> B: Condition 1
   A --> [*]: Condition 2
   B --> [*]
`;

export const stateDiagramWithFork = `
   stateDiagram-v2

   state A <<fork>>
   state D <<join>>

   [*] --> A: Start
   A --> B: Fork 1
   A --> C: Fork 2
   B --> D
   C --> D
   D --> [*]: End
`;

export const stateDiagramWithLoopCondition = `
   stateDiagram-v2

   state B <<choice>>
   state D <<choice>>

   [*] --> A
   A --> B
   B --> [*]: Condition 1
   B --> D: Condition 2
   D --> B
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
      in 2 lines
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

   state C1 <<choice>>
   state C2 <<choice>>

   [*] --> A
   A --> C1
   C1 --> C2
   C1 --> B
   C2 --> B
   C2 --> D
   B --> [*]
   D --> [*]

   note left of C1
      this is multiline
      comment left of
      first choice
   end note

   note right of C2
      this is another
      multiline comment
      right of second choice
   end note
`;
