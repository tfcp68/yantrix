---
title: Testing the Code Generator
---

# Testing the Code Generator

Tests for `@yantrix/codegen` live in `packages/codegen-tests/`. They follow a two-layer model: **structural** (assert the generated source text) and **execution** (run the generated code). Python adds a third layer via subprocess.

> [!NOTE]
> Generated files are written to `packages/codegen-tests/src/fixtures/generated/` at test time and are gitignored. Delete them to force regeneration.

## 📁 Layout

```
packages/codegen-tests/src/
  javascript.test.ts          # JS dialect
  typeScript.test.ts          # TS dialect
  pureJavaScript.test.ts      # PureJS dialect
  pureTypeScript.test.ts      # PureTS dialect (+ .d.ts declarations)
  python.test.ts              # Python dialect
  forks.test.ts               # fork/predicate tests (JS/TS)
  fixtures/
    utils.ts                  # shared helpers
    generated/                # runtime output (gitignored)
    injects/                  # fixture files for inject-functions tests
```

One test file per dialect. Cross-cutting features (forks, event bus, internals) live either in the dialect file or in a dedicated file when shared logic warrants it.

## 🔧 Utilities (`fixtures/utils.ts`)

| Helper                               | Returns                     | Use for                                             |
| ------------------------------------ | --------------------------- | --------------------------------------------------- |
| `generateAutomata(opts)`             | `string` (generated source) | Structural tests — no file I/O                      |
| `generateAndSave(opts, prefix)`      | `void`                      | Execution tests — writes `{prefix}_generated.{ext}` |
| `generateAndSaveFiles(opts, prefix)` | `string` (entry path)       | Multi-file output (e.g. PureTS `.js` + `.d.ts`)     |

**`opts` shape:**

```typescript
type TGenerateAutomataParams = {
	input: string; // Mermaid stateDiagram-v2 source
	automataName: string; // becomes the class/factory name
	lang: ModuleNames; // target dialect
	injects?: string; // path to a .js/.py inject file
};
```

**Naming conventions:**

- `automataName: 'MyFSM'` → factory function `createMyFSM()`, Python factory `create_my_fsm()`
- `prefix: 'pjs_traffic'` → file `pjs_traffic_generated.js`
- Prefix pattern: `{dialect}_{feature}` — e.g. `pjs_traffic`, `pts_forks`, `py_define`

## 🏗️ Layer 1: Structural Tests

Assert that the generated source contains expected patterns. No file is written; no code is run.

```typescript
import { ModuleNames } from "@yantrix/codegen";
import { describe, expect, it } from "vitest";
import { generateAutomata } from "./fixtures/utils.js";

const input = `stateDiagram-v2
  [*] --> Off: Reset
  Off --> On: Toggle
note left of Off
  +Init
end note
`;

describe("my-dialect codegen - structural", async () => {
	const code = await generateAutomata({
		input,
		automataName: "LightSwitch",
		lang: ModuleNames.PureJavaScript,
	});

	it("generates statesDictionary", () => {
		expect(code).toContain("statesDictionary");
	});

	it("generates Off state", () => {
		expect(code).toContain("Off");
	});

	it("generates reducer for Toggle action", () => {
		expect(code).toMatch(/Toggle/);
	});
});
```

> [!TIP]
> Structural tests run fast and need no runtime. Use them to verify that all expected symbols, function names, and dictionary keys are present before adding execution tests.

## ⚡ Layer 2: Execution Tests (JS / TS / PureJS / PureTS)

Generate a file, import it dynamically, instantiate the FSM, and assert runtime behaviour.

```typescript
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ModuleNames } from "@yantrix/codegen";
import { beforeEach, describe, expect, it } from "vitest";
import { generateAndSave } from "./fixtures/utils.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const generatedDir = path.resolve(dirname, "fixtures/generated");
const getGeneratedPath = (name: string) => path.join(generatedDir, name);

const input = `stateDiagram-v2
  [*] --> Off: Reset
  Off --> On: Toggle
  On --> Off: Toggle
note left of Off
  +Init
  #{ counter = 0 } <= inc(#counter = 0)
end note
note left of On
  #{ counter = 0 } <= inc(#counter = 0)
end note
`;

describe("pure-javascript codegen - execution", async () => {
	await generateAndSave(
		{
			input,
			automataName: "LightSwitch",
			lang: ModuleNames.PureJavaScript,
		},
		"pjs_switch",
	);

	const { createLightSwitch, statesDictionary, actionsDictionary } =
		await import(getGeneratedPath("pjs_switch_generated.js"));

	let fsm: ReturnType<typeof createLightSwitch>;

	beforeEach(() => {
		fsm = createLightSwitch(); // fresh instance per test
	});

	it("initial state is Off", () => {
		expect(fsm.state).toBe(statesDictionary.Off);
	});

	it("Toggle transitions Off -> On", () => {
		fsm.dispatch({ action: actionsDictionary.Toggle, payload: {} });
		expect(fsm.state).toBe(statesDictionary.On);
	});

	it("counter increments each dispatch", () => {
		fsm.dispatch({ action: actionsDictionary.Toggle, payload: {} });
		fsm.dispatch({ action: actionsDictionary.Toggle, payload: {} });
		expect(fsm.getContext().context.counter).toBe(2);
	});

	it("unknown action is ignored", () => {
		const before = fsm.state;
		fsm.dispatch({ action: -999, payload: {} });
		expect(fsm.state).toBe(before);
	});
});
```

**Standard lifecycle assertions to include per dialect:**

| Behaviour        | What to assert                               |
| ---------------- | -------------------------------------------- |
| Initial state    | `fsm.state === statesDictionary.X`           |
| State transition | dispatch, then check `fsm.state`             |
| `lastAction`     | `null` initially, set after dispatch         |
| `currentCycle`   | starts 0, increments per successful dispatch |
| Context update   | `fsm.getContext().context.field`             |
| Unknown action   | state unchanged, cycle unchanged             |
| Pause / resume   | queued dispatch fires after `resume()`       |
| Disable / enable | disabled machine ignores dispatches          |

### Forks

```typescript
const forksInput = `stateDiagram-v2
  [*] --> Check: Start
  Check --> High: Eval [isGreater($score, 50)]
  Check --> Low: Eval
note left of [*]
  +Init
end note
`;

describe("pure-javascript codegen - forks", async () => {
	await generateAndSave(
		{
			input: forksInput,
			automataName: "ForkTest",
			lang: ModuleNames.PureJavaScript,
		},
		"pjs_forks",
	);
	const {
		createForkTest,
		statesDictionary: s,
		actionsDictionary: a,
	} = await import(getGeneratedPath("pjs_forks_generated.js"));

	it("score > 50 routes to High", () => {
		const fsm = createForkTest();
		fsm.dispatch({ action: a.Eval, payload: { score: 80 } });
		expect(fsm.state).toBe(s.High);
	});

	it("score <= 50 routes to Low", () => {
		const fsm = createForkTest();
		fsm.dispatch({ action: a.Eval, payload: { score: 30 } });
		expect(fsm.state).toBe(s.Low);
	});
});
```

### Epoch

Epoch is module-level state shared across all instances. Use **relative** assertions:

```typescript
it("epoch increments per successful dispatch", () => {
	const before = epochMod.getEpoch();
	const fsm = epochMod.createLightSwitch();
	fsm.dispatch({ action: epochMod.actionsDictionary.Toggle, payload: {} });
	expect(epochMod.getEpoch()).toBe(before + 1);
});

it("unknown action does not increment epoch", () => {
	const before = epochMod.getEpoch();
	const fsm = epochMod.createLightSwitch();
	fsm.dispatch({ action: -999, payload: {} });
	expect(epochMod.getEpoch()).toBe(before);
});
```

### Internals in context

`_currentCycle()` captures the **pre-dispatch** cycle counter (i.e. `currentCycle - 1` after dispatch):

```typescript
it("context.cycle reflects pre-dispatch cycle", () => {
	const fsm = createCycleTest();
	fsm.dispatch({ action: intActions.step, payload: {} });
	// _currentCycle() ran before the increment → one behind currentCycle
	expect(fsm.getContext().context.cycle).toBe(fsm.currentCycle - 1);
});
```

## 🐍 Layer 3: Python Execution Tests

Python tests are **conditional**: they skip when Python or `pydash` is absent.

```typescript
import { execSync } from "node:child_process";
import { describe } from "vitest";

function isPythonAvailable(): string | null {
	for (const cmd of ["python3", "python"]) {
		try {
			execSync(`${cmd} --version`, { stdio: "ignore" });
			execSync(`${cmd} -c "import pydash"`, { stdio: "ignore" });
			return cmd;
		} catch {
			// try next
		}
	}
	return null;
}

const pythonCmd = isPythonAvailable();
const describeExec = pythonCmd ? describe : describe.skip;
```

Each test builds a Python script as a template literal, flattens it to one line, and runs it via `execSync`. The script asserts a condition and prints `'ok'`:

```typescript
describeExec("python codegen - execution", async () => {
	await generateAndSave(
		{ input, automataName: "TrafficLight", lang: ModuleNames.Python },
		"py_traffic",
	);

	it("dispatch transitions Off -> Red", () => {
		const script = `
import sys
sys.path.insert(0, r'${generatedDir}')
from py_traffic_generated import create_traffic_light, states_dictionary, actions_dictionary
fsm = create_traffic_light()
fsm['dispatch']({'action': actions_dictionary['Switch'], 'payload': {}})
assert fsm['state']() == states_dictionary['Red'], f"got {fsm['state']()}"
print('ok')
`.trim();
		const out = execSync(
			`${pythonCmd} -c "${script.replace(/"/g, '\\"').replace(/\n/g, "; ")}"`,
			{ encoding: "utf8", timeout: 10000 },
		);
		expect(out.trim()).toBe("ok");
	});
});
```

**Python FSM accessor API** (generated dict of lambdas):

| Key                                    | Type   | Description                             |
| -------------------------------------- | ------ | --------------------------------------- |
| `fsm['state']()`                       | `int`  | Current state hash                      |
| `fsm['dispatch'](ap)`                  | —      | `ap = {'action': int, 'payload': dict}` |
| `fsm['get_context']()`                 | `dict` | `{'state': int, 'context': dict}`       |
| `fsm['current_cycle']()`               | `int`  | Dispatch count                          |
| `fsm['pause']()` / `fsm['resume']()`   | —      | Queue control                           |
| `fsm['disable']()` / `fsm['enable']()` | —      | Enable/disable                          |

## 📐 Diagram Conventions

- **`+Init`** in a state note marks the initial state — always required.
- Keep diagrams minimal: one feature per `describe` block, one diagram per feature.
- Use linear chains for transition tests (`A --> B --> C`).
- Use self-loops for reducer/context tests (`A --> A: update`).
- Fork guard syntax: `State --> Target: Action [predicate($payload_key, literal)]`
- Subscribe syntax (in note): `subscribe/eventName ACTION_NAME`
- Emit syntax (in note): `emit/eventName`

```
stateDiagram-v2
  [*] --> A: Start
  A --> B: step
  B --> A: step
note left of A
  +Init
  #{ val = 0 } <= inc(#val = 0)
end note
note left of B
  #{ val = 0 } <= inc(#val = 0)
end note
```

## ✅ Feature Coverage Checklist

When adding a new dialect, cover all applicable rows:

| Feature                     | Structural                       | Execution                               |
| --------------------------- | -------------------------------- | --------------------------------------- |
| State dictionary generated  | `toContain('statesDictionary')`  | initial `fsm.state` matches             |
| Action dictionary generated | `toContain('actionsDictionary')` | dispatch by action value works          |
| State transitions           | symbol present                   | Off → Red after dispatch                |
| Context / reducers          | reducer fn present               | `fsm.getContext().context.field`        |
| Built-in functions          | fn name in code                  | `mult(5, 2) == 10`                      |
| Define directive            | `function_dictionary['name']`    | custom fn result                        |
| Inject functions            | inject symbol present            | injected fn returns expected value      |
| Forks / predicates          | predicate code present           | score > 50 → High, else Low             |
| Subscribe / EventBus        | adapter code present             | `EventBus.dispatch` triggers transition |
| Emit                        | emit code present                | callback receives event                 |
| Epoch                       | `getEpoch` exported              | relative before/after assertions        |
| Internals in context        | `_currentCycle` in reducer       | `context.cycle == fsm.currentCycle - 1` |
| Pause / resume              | —                                | queued dispatch fires on resume         |
| Disable / enable            | —                                | disabled machine ignores dispatch       |
| TypeScript declarations     | (PureTS only) `.d.ts` present    | `export declare const statesDictionary` |

## 🚀 Running Tests

```sh
# All codegen tests
pnpm -F @yantrix/codegen-tests vitest run

# Verbose output with individual test names
pnpm -F @yantrix/codegen-tests vitest run --reporter=verbose

# Single file
pnpm -F @yantrix/codegen-tests vitest run --reporter=verbose src/pureJavaScript.test.ts

# After a codegen change, rebuild first
pnpm -F @yantrix/codegen build
pnpm -F @yantrix/codegen-tests vitest run
```

> [!IMPORTANT]
> The codegen reads templates from `dist/templates/`. Always rebuild `@yantrix/codegen` after editing Eta templates — otherwise tests run against stale compiled output.
