---
title: Patching Codegen Dialects
---

# Patching Codegen Dialects

This guide covers the things most likely to waste your time when fixing TypeScript errors in
generated automata files. Read it before touching any template or core library.

---

## The golden rule

**Never patch a core library to fix an error in generated code.**

If `@yantrix/automata` or `@yantrix/core` types are too strict for your generated output, the
fix belongs in the template or the expression serializer, not in the library. Widening a library
type to satisfy generated code breaks the contract for all real consumers.

---

## How generated TS output is produced

Generated code comes from two sources. Both must be correct for the output to type-check:

### 1. Eta templates

Templates live in `packages/codegen/src/core/templates/`. The two dialects share templates:

- `ts/` - TypeScript-only templates (class body, type declarations)
- `js/` - JavaScript templates, **reused by both JS and TS dialects**
- `js/shared/` - shared sub-templates (events, dictionaries, forks, context)

The `hasTypes` boolean in the template model (`it.hasTypes`) gates all TS-specific output.

**Rule:** Any TS-specific code added to a `js/shared/` template must be wrapped in
`<% if (it.hasTypes) { %>`. Otherwise it emits into plain JS output too.

### 2. Expression serializer (TypeScript source, not a template)

`functionDictionary.get('name')(...)` expressions are assembled in:

```
packages/codegen/src/core/modules/JavaScript/JavaScriptCompiler/expressions/serializer.ts
  getFunctionFromDictionary(name, hasTypes?)  -- appends ! when hasTypes

packages/codegen/src/core/modules/JavaScript/JavaScriptCompiler/expressions/core.ts
  setupExpressions({ constants, hasTypes? })  -- passes hasTypes to serializer

packages/codegen/src/core/modules/TypeScript/codegen.ts
  constructor() {
    super(params);
    this.expressions = JavaScriptCompiler.expressions.functions.setupExpressions({
      constants: this.constants,
      hasTypes: true,           // overrides JS version; must be AFTER super()
    });
  }
```

If `functionDictionary.get(...)` in generated code is called without `!`, the fix is in
`serializer.ts`, not in a template. The `FunctionDictionary.get()` return type is
`TAutomataFunction | null`; it never actually returns null (it throws), but TypeScript cannot
know that.

---

## hasTypes propagation

`TypeScriptCodegen` sets `hasTypes: true` in module data. The top-level TS template
(`ts/module.eta`) must spread it into every sub-include:

```eta
<%~ include('../js/shared/forks/module',       {...it, hasTypes: true}) %>
<%~ include('../js/shared/dictionaries/module', {...it, hasTypes: true}) %>
<%~ include('../js/shared/events/module',       {...it, hasTypes: true}) %>
<%~ include('../js/context/module',             {...it, hasTypes: true}) %>
<%~ include('class/module',                     {...it, hasTypes: true}) %>
```

If a shared sub-template is not receiving `hasTypes: true`, add the spread at the include site
in `ts/module.eta`. Do not change the sub-template's default -- it must still work without
`hasTypes` for the JS dialect.

---

## TypeScript strict mode patterns

The root tsconfig has `strict: true`, `noUnusedLocals`, `noUnusedParameters`, and
`noUncheckedIndexedAccess`. Generated files must satisfy all of these. Use these patterns in
templates:

| Error | Pattern | Eta example |
|---|---|---|
| Unused local (`noUnusedLocals`) | `void [x, y, z]` | `void [getEpoch, _getCurrentTime]` |
| Unused parameter (`noUnusedParameters`) | `_` prefix | `_id: string` |
| Unused param, but body needs it | `void param` inside fn | `void payload;` |
| Array index possibly undefined | `!` assertion | `actionMove.state[0]!` |
| `FunctionDictionary.get()` nullable | `!` assertion | `functionDictionary.get('f')!` |
| Reducer map indexed by nullable state | `!` on state | `reducer[this.state!]` |
| Validator must be type predicate | `: s is TStateId` return + cast | `(s: TBase): s is TStateId => arr.includes(s as TStateId)` |
| `FinalizationRegistry` missing from ES2020 lib | globalThis cast | `(globalThis as any).FinalizationRegistry` |
| `getFunctionRegistry()` returns nullable | cast | `this.getFunctionRegistry() as FunctionDictionary` |
| Event bus handler type mismatch | `as any` on subscribe | `EventBus.subscribe(id, _handler as any)` |
| `Set<never>` from empty literal | explicit generic | `new Set<TStateId>([])` |

---

## withPredicate and _forkPredicates

`_forkPredicates` is only generated when at least one transition has `withPredicate: true`.
In `it.dictionaries.actionToStateFromState`, `withPredicate` is `true` only when an action
from a given state can lead to 2 or more different destination states (a fork).

Most example FSMs have deterministic transitions (`withPredicate: false` everywhere), so
`_forkPredicates` must not be emitted for them. `js/shared/forks/module.eta` guards this with:

```js
const hasForkTransitions = Object.values(it.dictionaries?.actionToStateFromState ?? {})
  .some(actions => Object.values(actions).some(entry => entry.withPredicate));
```

If `TS6133: '_forkPredicates' is declared but never read` appears, this guard is missing.

---

## Turbo cache and cascading errors

Changing any shared Eta template invalidates the turbo cache for **all** example builds, not
just the one you are fixing. This surfaces pre-existing TypeScript errors in examples you did
not touch.

When this happens:
- Do not assume the newly surfaced errors are regressions from your change.
- Run `pnpm -w run build` after each template fix to get the full picture.
- Fix all surfaced errors before concluding the work is done.
- The `test_reports/<pkg>.md` files contain structured failure details after a test run.

---

## Checklist before opening a PR

- [ ] No TS errors in any example: `pnpm -w run build` exits 0
- [ ] Test suite green: `pnpm test` (3900+ passing, 0 failed)
- [ ] Shared templates still produce valid JS when `it.hasTypes` is absent
- [ ] No changes to `@yantrix/core`, `@yantrix/automata`, or other non-codegen packages to
      work around generated code errors
