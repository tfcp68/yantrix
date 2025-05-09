/**
 * @packageDocumentation
 *
 * The `@yantrix/yantrix-parser` package is a parser for the Yantrix subsyntax found inside of the notes from Mermaid diagrams.
 * Processing done by this package enables most of Yantrix's features, such as event handling, conditional logic, custom functions, etc.
 *
 * It's not encouraged to use this package individually, as it's useful only for processing Yantrix syntax during the creation of automatas
 * together with packages like `automata` and `mermaid-parser` (all of this is included inside of the `core` package).
 *
 * Lexer and parser are created with the help of `langium` package.
 *
 * See also:
 * - [Yantrix diagram syntax](/syntax)
 * - [Mermaid Parser API](/API/mermaid-parser/)
 */

export * from './constants/index.js';
export * from './core/yantrixParser.js';
export * from './types/index.js';
