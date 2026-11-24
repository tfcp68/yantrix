---
title: Code Generation
---

# Code Generation

## Why generate code from diagrams?

State machine logic is one of the most diagram-friendly kinds of software: a box-and-arrow
picture of states and transitions IS the specification. When that picture is also the source
of truth for the running code, several things follow naturally:

**No drift.** The diagram in your architecture docs is the same artifact that produces the
runtime. They cannot contradict each other because they are the same file.

**Polyglot from one source.** A single `.mermaid` diagram generates a TypeScript class, a
zero-dependency JS factory, a Python module, or a Java class. The business logic lives once;
the target language is a flag.

**Review-friendly.** FSM changes appear in diffs as Mermaid syntax, which non-engineers can
read. The generated output changes are a consequence, not the subject of review.

**Living documentation.** Embedding state diagrams in architectural decision records (ADRs)
or wikis is standard practice. With Yantrix, those diagrams are not illustrations -- they
are the implementation.

## Codegen as a tool

Yantrix codegen can be invoked two ways:

**CLI** -- suitable for build scripts, CI, and one-off generation:

```bash
yantrix codegen ./diagram.mermaid -l typescript -o src/Automata.ts -c MyAutomata
```

See [CLI Reference](../integrations/050_cli.html) for all options.

**API** -- embed generation in Node.js tooling:

```typescript
import { readFile } from 'node:fs/promises';
import { generateAutomataFromStateDiagram } from '@yantrix/codegen';
import { parseStateDiagram, createStateDiagram } from '@yantrix/mermaid-parser';

const diagramText = await readFile('./diagram.mermaid', 'utf8');
const structure = await parseStateDiagram(diagramText);
const matrix = await createStateDiagram(structure);
const code = await generateAutomataFromStateDiagram(matrix, {
  outLang: 'typescript',
  className: 'MyAutomata',
  eventBusOrder: 'lifo',
});
```

## Event bus order

The generated bus delivers pending events in first-in, first-out order by default.
Set `eventBusOrder` to `'lifo'` to deliver the newest pending event first, as in
the TypeScript example above. For example, if `A` and `B` are both queued in that
order before delivery starts, FIFO delivers `A` then `B`. LIFO delivers `B` then
`A`. The option configures the generated bus. In the TypeScript reference runtime,
all machines and slices connected to one `CoreLoop` follow the delivery order
of that loop's shared bus. For a
given emitted event, effects still run in matrix registration order and then
in their declaration order.

`generateAutomataFromStateDiagram` and `generateAutomataFiles` accept this option
for JavaScript, TypeScript, their pure dialects, and Python. Java generates an
FSM without an event bus and rejects an explicit `eventBusOrder` option. On the
command line, use `--eventBusOrder fifo` or `--eventBusOrder lifo`.

## Supported languages

See [Language Support](../integrations/100_language_support.html) for the full feature
matrix across all dialects.

## Implementation internals

If you are contributing to codegen or adding a dialect, see:

- [Codegen Architecture Overview](../contributing/07_codegen_overview.html) -- dialect
  comparison and code generation pipeline
- [JS / TS Dialect Template Reference](../contributing/08_codegen_js_ts.html)
- [PureJS / PureTS Dialect Template Reference](../contributing/09_codegen_pure.html)
- [Python Dialect Template Reference](../contributing/10_codegen_python.html)
