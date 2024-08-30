export const blankDiagram = '';

export const invalidDiagram = 'invalidDiagram';

export const emptySequenceDiagram = 'sequenceDiagram';

export const sequenceDiagramSimpleMessage = `
sequenceDiagram
    A->>B: Message1
`;

export const sequenceDiagramLoopMessage = `
sequenceDiagram
    A->>A: Message1
`;

export const sequenceDiagramDifferentArrowMessages = `
sequenceDiagram
    A->B: Message1
    B-->A: Message2
    A->>B: Message3
    B-->>A: Message4
    A-xB: Message5
    B--xA: Message6
    A-)B: Message7
    B--)A: Message8
`;

export const sequenceDiagramActors = `
sequenceDiagram
    actor A
    participant B
    A->>B: Message1
    B->>C: Message2
`;

export const sequenceDiagramSimpleActivations = `
sequenceDiagram
    A->>+B: Message1
    B-->>-A: Message2
`;

export const sequenceDiagramComplexActivations = `
sequenceDiagram
    B->>+A: Message1
    A->>+B: Message2
    B->>A: Message3
    B->>A: Message4
    B->>-A: Message5
    A->>-B: Message6
`;

export const sequenceDiagramDoubleActorActivations = `
sequenceDiagram
    A->>+B: Message1
    A->>+B: Message2
    B->>A: Message3
    B->>-A: Message4
    B->>-A: Message5
    A->>B: Message6
    A->>+B: Message7
    B->>B: Message8
    B->>-A: Message9
`;

export const sequenceDiagramSideNote = `
sequenceDiagram
    note left of A: Note1
    A->>B: Message1
`;

export const sequenceDiagramSpanningNote = `
sequenceDiagram
    actor A
    participant B
    note left of A: Note1
    note over A, B: Note2
    A->>+B: Message1
    B-->>-A: Message2
`;

export const sequenceDiagramThreeActorsActivations = `
sequenceDiagram
    autonumber
    actor A1
    participant A2
    participant A3
    A1->>+A3: Message1
    A3->>+A2: Message2
    A2-->>-A3: Message3
    A3-->>-A1: Message4
    A1->>A1: Message5
`;
