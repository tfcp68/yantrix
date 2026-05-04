You are adding a new **feature** to one or more existing Yantrix codegen dialects.
A feature is new runtime capability emitted into generated code (e.g. epoch tracking, event bus, cycle counter, predicate support for a dialect that lacks it).
This is NOT a new dialect.

The argument is: feature intent + contracts. Example:
`"add epoch tracking to Python - expose get_epoch() at module level returning int, epoch increments on each dispatch call"`

Follow these steps exactly.

---

## Phase 1 - Understand the feature

### 1.1 Parse the intent

Extract:

- **Feature name** - short label, e.g. `epoch-tracking`, `event-bus`, `forks`
- **Affected dialects** - list explicitly; if "all", enumerate all active dialects from `packages/codegen/src/core/modules/index.ts`
- **Contracts** - exported symbols, instance properties, behavioral invariants stated in the argument

If the argument is missing or ambiguous, ask the user to clarify before reading any files.

### 1.2 Read current structure

Read these files before asking anything:

- `packages/codegen/src/core/modules/index.ts` - active dialect list (`ModuleNames`, `Modules`)
- For each affected dialect's codegen class: read `buildTemplateModel()` to understand current `it` shape
- Entry-point `module.eta` for each affected dialect under `packages/codegen/src/core/templates/`
- The sub-template(s) most relevant to the feature's logical section (see below)
- `packages/codegen-tests/src/fixtures/utils.ts` - `generateAndSave`, `wrapClassInstance`, `wrapFunctionalInstance`, `TFSMAdapter`
- Any existing feature of similar scope in the codebase to understand the established pattern (e.g. read how epoch tracking is done in `pure-js` before adding it to Python)

To identify which section the feature belongs to: read each affected dialect's `module.eta` and list the `include(...)` calls in order. Each include corresponds to one logical section (imports, runtime, forks, dictionaries, functions, events, context, factory/class). Match the feature's nature to the section that handles similar existing features. The ordered include list in `module.eta` is authoritative - do not assume section names from memory.

### 1.3 Identify template sharing boundaries

Before designing changes, map which templates are shared across dialects:

- Shared templates are consumed by multiple dialects. Changes propagate to all consumers.
- Dialect-specific templates are isolated.
- Use `<% if (it.someFlag) { %>` to gate output to a subset of consumers of a shared template.
- Introduce a new flag on `it` (set in `buildTemplateModel()`) only when a shared template must emit different output per dialect.

To determine sharing: trace `include(...)` calls from each affected dialect's `module.eta` upward.

---

## Phase 2 - Architectural questions

Ask the user these questions. Present as numbered list. Wait for all answers before Phase 3.

1. **Dialect scope** - Which dialects get this feature? If "all dialects", confirm whether every dialect must expose identical semantics in its generated API (same function names, same behavioral contracts), with syntax optimized per language independently.

2. **Data origin** - Is the data needed by templates purely derivable from objects already passed to `buildTemplateModel()` (diagram, dictionaries, constants, injectedFunctions)? Or does it require new input fields in `IGenerateOptions` / `TModuleParams` / a new build-time `.tpl` file?

3. **Template size** - Will the new template content for any single dialect exceed ~50 lines? If yes, create a new sub-template directory. If no, inline into the appropriate existing sub-template. Always prefer ETA templates over string concatenation in codegen TypeScript source.

4. **Exportability** - Should the new functionality be exported from the generated file (accessible to consumers of the generated code)? If yes: list all symbols to export (functions, constants, types). This drives whether `pure-ts/declarations.eta` needs `export declare` lines and whether TS class statics need updating.

5. **Instance shape** - Does the feature add a new property or method to the FSM instance (the object returned by `create<ClassName>()` for functional dialects, or the class instance for `javascript`/`typescript`)? If yes: name, type, and whether it is read-only or callable.

6. **Interaction with existing features** - Does this feature interact with or depend on any of: forks/predicates, event bus/adapter, function dictionary, inject functions, constants, cycle counter (`currentCycle`), epoch, pause/resume/disable lifecycle? Describe any wiring needed.

---

## Phase 3 - Determine the `it` model impact

**Do not ask the user. Determine this yourself** from the answers to Phase 2 and your reading of the codegen classes.

For each affected dialect class:

1. Does `buildTemplateModel()` already produce everything the new templates need? If yes, no model change needed.
2. If new data is needed: identify the minimal set of new keys to add. Follow the naming convention of adjacent keys in the same `buildTemplateModel()`. If the dialect uses a language-specific sub-namespace (like `it.python.*`), add new data there rather than top-level. If it uses a flat top-level object, add top-level keys.
3. Prefer plain data structures (arrays of plain objects, Records) over class instances in `it`. Template data should be serializable.
4. Use dispatch-by-key objects (Records keyed by state/action id) over switch/case in `buildTemplateModel()` source. Templates should iterate over these via `forEach` / `Object.entries`.

Document the exact new keys and their types before writing any template.

---

## Phase 4 - Build the implementation plan

### 4.1 Group dialects for parallel work

Do NOT hardcode dialect group assignments. Apply this algorithm:

1. For each affected dialect, list its template entry point and the shared sub-templates it includes.
2. Group dialects that **share at least one template file that must be modified** into the same agent - they cannot be edited in parallel safely.
3. Dialects that share NO modified templates can be worked on in parallel.
4. Further split a group into sub-agents only if the total estimated LoC of changes exceeds ~200 lines per agent.

Re-derive groupings by tracing includes - do not assume them from memory. If a shared template is modified, the agent owning that template is responsible for all dialects that consume it. Other agents must not touch it.

### 4.2 Standard batch structure

**Batch 0 (sequential, if model changes needed):**
One agent. Scope: only `buildTemplateModel()` changes in codegen class files. No templates. Produces the `it` shape that all template agents depend on. Verify the shape is correct before proceeding.

**Batch 1 (parallel, N agents by dialect group):**
One agent per independent dialect group (derived by algorithm above). Each agent:

- Owns only the template files for its group
- May not edit templates owned by another group agent
- Implements changes using ETA templates, not string building in TypeScript

**Batch 2 (parallel, one agent per dialect):**
Test agents. Can run immediately after Batch 1 for their dialect group. Each test agent:

- Extends or creates one test file per dialect
- Must implement BOTH structural tests (string assertions on generated code) AND behavioral tests (dynamic import + dispatch)
- Python behavioral tests go in a `describeExec` block guarded by `pythonCmd != null`

### 4.3 Specify each agent's work

For each agent in each batch, list:

1. **Files** - absolute paths to create or modify
2. **Change** - what is added/modified, referencing specific existing line numbers where the change anchors (e.g. "add include after line 6 of `pure-js/module.eta`")
3. **Template approach** - name the ETA template section and the Eta include path. Never describe the output as a string to be built in TypeScript.
4. **Codestyle rules** the agent must follow:
   - Match the code style of generated output for the dialect (read existing generated fixtures in `packages/codegen-tests/src/fixtures/generated/` as reference)
   - In templates: use `forEach` / map iterations over inline `if` chains
   - In `buildTemplateModel()`: prefer `Record<id, data>` dispatch tables over switch/case
   - Plain data + functions over OOP in both template model and generated output
   - No comments in generated code unless they appear in existing generated output for that dialect
5. **Test assertions** - for behavioral tests: list the specific `dispatch()` calls and `expect()` checks; for structural tests: list the `toContain` / `toMatch` patterns

---

## Phase 5 - Confirm with user

Present a concise summary:

- Feature name and final dialect list
- Whether Batch 0 is needed and what `it` keys it adds
- How many agents in Batch 1, what dialect group each covers, estimated files per agent
- How many agents in Batch 2 and which dialect each covers
- The PR checklist (see Phase 6)

Ask for explicit confirmation. Do not proceed to Phase 6 until confirmed.

---

## Phase 6 - Execute

Run batches in order. Within each batch, spawn agents in parallel (single message, multiple Agent tool calls).

Pass each agent:

- The relevant portion of the plan from Phase 4
- Exact file paths and anchor line numbers
- The codestyle rules from 4.3
- Instruction to run `pnpm -F @yantrix/codegen-tests test` after changes and report failures

After all batches: verify PR checklist below.

---

## PR checklist

- [ ] `buildTemplateModel()` updated in all affected codegen classes
- [ ] New `it` keys documented (inline comment in `buildTemplateModel()` if non-obvious)
- [ ] Sub-templates created or modified under `packages/codegen/src/core/templates/`
- [ ] Include lines added to the correct `module.eta` entry points
- [ ] TypeScript declaration files updated if new exported symbols are added
- [ ] All affected dialects: structural tests added (generated code contains expected strings)
- [ ] All affected dialects: behavioral tests added (dispatch changes state/context as specified)
- [ ] Python execution tests added in `describeExec` block
- [ ] No existing tests broken: `pnpm -F @yantrix/codegen-tests test`
- [ ] `TFSMAdapter` in `packages/codegen-tests/src/fixtures/utils.ts` updated if feature adds universally-available instance property
- [ ] Language support table updated: `docs/integrations/100_language_support.md`
- [ ] API docs updated for each affected dialect (find doc files under `docs/integrations/`)

---

## How to discover the structure

The codebase evolves. Always derive structure from source, not from memory or this document.

**Finding active dialects:** Read `packages/codegen/src/core/modules/index.ts`. The `ModuleNames` constant enumerates every active dialect key. The `Modules` map links each key to its codegen class. This is the ground truth.

**Finding a dialect's codegen class:** Each value in `Modules` is a class. Follow the import to its source file. Read `buildTemplateModel()` - its return object is the `it` shape for that dialect. Do not assume keys; read the actual return statement.

**Finding a dialect's templates:** Read the `getCode()` method - it calls `eta.renderTemplateSync(templatePath, ...)` to get the exact entry-point template path. From `module.eta`, trace `include(...)` calls recursively to map the full template tree and identify which sub-templates are shared with other dialects.

**Finding test patterns:** Read `packages/codegen-tests/src/fixtures/utils.ts`. Read the existing test file for the most similar dialect to understand setup (generate -> import -> wrap -> assert). Read `packages/codegen-tests/src/fixtures/generated/` to see what correct generated output looks like for each dialect.
