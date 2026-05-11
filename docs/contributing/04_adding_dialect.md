---
title: Adding a New Dialect
---

# Adding a New Dialect

A "dialect" is a target language for Yantrix codegen. Each dialect is a class that knows how to
render an FSM from a parsed diagram model into source code for that language.

`pure-javascript` is the canonical reference implementation for a new dialect.

---

## What a dialect is

A dialect consists of:

1. A codegen class (extends `JavaScriptCodegen` or `AbstractCodegen`)
2. One or more Eta templates (`src/core/templates/<dialect>/`)
3. A registration entry in `src/core/modules/index.ts`
4. Optional: inject function handler in `src/core/InjectFunctionsProcess.ts`

---

## Step-by-step

### 1. Pick a name and add it to `ModuleNames`

`src/core/modules/index.ts`:

```typescript
export const ModuleNames = {
  // ...existing
  MyLang: 'my-lang',
} as const;
```

Add the corresponding entry to `Modules` and `TGetCodeOptionsMap` in the same file.

### 2. Create the codegen class

`src/core/modules/MyLang/codegen.ts`:

```typescript
import { JavaScriptCodegen } from '../JavaScript/codegen.js';
import { IGenerateOptions } from '../../../types/common.js';

export class MyLangCodegen extends JavaScriptCodegen {
  getCode(options: IGenerateOptions): string {
    // render 'my-lang/module' Eta template
    return this.eta.renderTemplateSync('my-lang/module', this.buildTemplateModel(options));
  }
}
```

Extending `JavaScriptCodegen` gives you `buildTemplateModel()` for free. It populates:
- `it.states`, `it.transitions`, `it.actionChains`
- `it.functions.customRegistrations` (user-defined + inject)
- `it.dictionaries` (state/action/event numeric ids)

Override `buildTemplateModel()` only if you need to transform the model.

### 3. Create templates

Create `src/core/templates/my-lang/module.eta` and sub-templates as needed.

Template section order (match this for consistency):

| # | Section | Sub-template path |
|---|---------|------------------|
| 1 | imports | `my-lang/imports/module` |
| 2 | runtime | `my-lang/runtime/module` |
| 3 | forks | reuse `js/shared/forks/module` if syntax is JS |
| 4 | dictionaries | reuse `js/shared/dictionaries/module` if syntax is JS |
| 5 | functions | `my-lang/functions/module` |
| 6 | events | `my-lang/events/module` |
| 7 | context | reuse `js/context/module` if syntax is JS |
| 8 | factory | `my-lang/factory/module` |

Shared JS sub-templates (`js/shared/forks/`, `js/shared/dictionaries/`, `js/context/`) emit
plain JavaScript with no class or import dependencies and are safe to reuse from any JS-syntax dialect.

### 4. Register the class

`src/core/modules/index.ts` - add to the `Modules` map:

```typescript
import { MyLangCodegen } from './MyLang/codegen.js';

export const Modules = {
  // ...existing
  [ModuleNames.MyLang]: MyLangCodegen,
};
```

### 5. Handle inject functions

`src/core/InjectFunctionsProcess.ts`:

```typescript
[ModuleNames.MyLang]: (filePath) => {
  if (filePath) throw new TypeError('MyLang does not support inject functions');
  return Promise.resolve({ path: null });
},
```

For dialects that support inject, mirror the `javascript` handler.

### 6. Multi-file output (optional)

If your dialect produces more than one file (e.g. `.js` + `.d.ts`), implement `getFiles()`:

```typescript
getFiles(options: IGenerateOptions): TCodegenFiles {
  return {
    [`${options.className}.js`]:   this.renderMain(options),
    [`${options.className}.d.ts`]: this.renderDeclarations(options),
  };
}
```

`generateAutomataFiles` in `src/index.ts` calls `getFiles()` when present.

### 7. Add `prettier` formatting (optional)

`src/index.ts` already applies prettier after generation when a parser is registered.
Add your dialect to `langParserMap`:

```typescript
const langParserMap: Partial<Record<string, Tprettier>> = {
  // ...existing
  [ModuleNames.MyLang]: 'babel',  // or 'typescript'
};
```

### 8. Write tests

Create `packages/codegen-tests/src/myLang.test.ts`.

Minimum coverage:

- Module-level exports exist (`statesDictionary`, `actionsDictionary`, factory function)
- State transitions work: `dispatch` changes `state`
- Context reducers update correctly
- Built-in function produces correct output
- Unknown action is a no-op

Use `generateAndSave` from `fixtures/utils.ts` to write the generated file and then import it dynamically.

---

## Template tips

- `it` is the template model. Inspect `buildTemplateModel()` output to see available fields.
- `<%~ include('path', it) %>` renders a sub-template with the same model.
- `<% ... %>` is a JS expression block (no output).
- `<%- ... %>` is an escaped output block.
- Templates live in `src/core/templates/` and are copied to `dist/templates/` at build time.

---

## PR checklist

- [ ] `ModuleNames` entry added
- [ ] Codegen class created and registered in `Modules`
- [ ] Templates created under `src/core/templates/<dialect>/`
- [ ] `InjectFunctionsProcess.ts` handler added
- [ ] Language support table updated (`docs/integrations/100_language_support.md`)
- [ ] API docs added or updated (`docs/integrations/160_pureAPI.md` or new page)
- [ ] Test file created with minimum coverage above
- [ ] All existing tests still pass: `pnpm -F @yantrix/codegen-tests test`
