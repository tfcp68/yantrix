/**
 * @packageDocumentation
 *
 * The `@yantrix/mermaid-parser` package is a parser for Mermaid state diagrams,
 * designed to transform Mermaid state diagrams into a structured format that can be used by the Yantrix framework.
 *
 * It's important to point out that this parser does not process the special Yantrix subsyntax, even though it is written inside notes in Mermaid diagrams.
 * Further processing of the notes is done by the Yantrix parser.
 *
 * It's not encouraged to use this package individually, as it's useful only for processing Yantrix syntax during the creation of automatas
 * together with packages like `automata` and `yantrix-parser` (all of this is included inside of the `core` package).
 *
 *  See also:
 * - [Yantrix diagram syntax](/syntax)
 * - [Yantrix Parser API](/API/yantrix-parser/)
 */

export * from './constants/index.js';
export * from './sequence/sequenceParser.js';
export * from './state/stateDiagram.js';
export * from './state/stateParser.js';
export * from './state/types/index.js';
export * from './utils/index.js';
