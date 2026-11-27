import { execFileSync, execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ModuleNames } from '@yantrix/codegen';
import { describe, expect, it } from 'vitest';
import { runBehaviorSuite, TBehaviorSpec, wrapFunctoryFactory } from './fixtures/behaviorSuite.js';
import { generateAndSave, generateAndSaveFiles, IFSMInstanceBase, wrapInstance } from './fixtures/utils.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const genPath = (name: string) => path.resolve(dirname, 'fixtures/generated', name);

// Minimal 3-state circular diagram — no context, no events
const diagram = `stateDiagram-v2
  [*] --> A: GO
  A --> B: STEP
  B --> C: STEP
  C --> A: STEP
note left of [*]
+Init
end note
`;

const AUTOMATA_NAME = 'SharedSpec';

// stateSequence starts from A (the first real state, after dispatching GO once)
const spec: TBehaviorSpec = {
	diagram,
	automataName: AUTOMATA_NAME,
	stateSequence: ['A', 'B', 'C', 'A'],
	actionName: 'STEP',
};

// ─── JS ──────────────────────────────────────────────────────────────────────

describe('shared behavior - JavaScript', async () => {
	await generateAndSave({ input: diagram, automataName: AUTOMATA_NAME, lang: ModuleNames.JavaScript }, 'shared_js');
	const mod = await import(genPath('shared_js_generated.js'));
	const { SharedSpec, actionsDictionary, statesDictionary } = mod as {
		SharedSpec: new () => IFSMInstanceBase;
		actionsDictionary: Record<string, number>;
		statesDictionary: Record<string, number>;
	};

	runBehaviorSuite(
		spec,
		() => {
			const inst = wrapInstance(new SharedSpec());
			inst.dispatch({ action: actionsDictionary.GO!, payload: {} });
			return inst;
		},
		{ statesDictionary, actionsDictionary },
	);
});

// ─── TypeScript ───────────────────────────────────────────────────────────────

describe('shared behavior - TypeScript', async () => {
	await generateAndSave({ input: diagram, automataName: AUTOMATA_NAME, lang: ModuleNames.TypeScript }, 'shared_ts');
	const mod = await import(genPath('shared_ts_generated.ts'));
	const { SharedSpec, actionsDictionary, statesDictionary } = mod as {
		SharedSpec: new () => IFSMInstanceBase;
		actionsDictionary: Record<string, number>;
		statesDictionary: Record<string, number>;
	};

	runBehaviorSuite(
		spec,
		() => {
			const inst = wrapInstance(new SharedSpec());
			inst.dispatch({ action: actionsDictionary.GO!, payload: {} });
			return inst;
		},
		{ statesDictionary, actionsDictionary },
	);
});

// ─── PureJavaScript ───────────────────────────────────────────────────────────

describe('shared behavior - PureJavaScript', async () => {
	await generateAndSave({ input: diagram, automataName: AUTOMATA_NAME, lang: ModuleNames.PureJavaScript }, 'shared_purejs');
	const mod = await import(genPath('shared_purejs_generated.js'));
	const { createSharedSpec, actionsDictionary, statesDictionary } = mod as {
		createSharedSpec: () => IFSMInstanceBase;
		actionsDictionary: Record<string, number>;
		statesDictionary: Record<string, number>;
	};

	runBehaviorSuite(
		spec,
		wrapFunctoryFactory(() => {
			const inst = createSharedSpec();
			inst.dispatch({ action: actionsDictionary.GO!, payload: {} });
			return inst;
		}),
		{ statesDictionary, actionsDictionary },
	);
});

// ─── PureTypeScript ───────────────────────────────────────────────────────────

describe('shared behavior - PureTypeScript', async () => {
	const entryPath = await generateAndSaveFiles(
		{ input: diagram, automataName: AUTOMATA_NAME, lang: ModuleNames.PureTypeScript },
		'shared_purets',
	);
	const mod = await import(entryPath);
	const { createSharedSpec, actionsDictionary, statesDictionary } = mod as {
		createSharedSpec: () => IFSMInstanceBase;
		actionsDictionary: Record<string, number>;
		statesDictionary: Record<string, number>;
	};

	runBehaviorSuite(
		spec,
		wrapFunctoryFactory(() => {
			const inst = createSharedSpec();
			inst.dispatch({ action: actionsDictionary.GO!, payload: {} });
			return inst;
		}),
		{ statesDictionary, actionsDictionary },
	);
});

// ─── Python ───────────────────────────────────────────────────────────────────

function isPythonAvailable(): string | null {
	for (const cmd of ['python3', 'python']) {
		try {
			execSync(`${cmd} --version`, { stdio: 'ignore' });
			return cmd;
		} catch {
			// try next
		}
	}
	return null;
}

const pythonCmd = isPythonAvailable();
const describeExec = pythonCmd ? describe : describe.skip;
const generatedDir = genPath('');

// Only Active has a local outgoing transition. Idle and Parked still accept global actions.
const globalActionsDiagram = `stateDiagram-v2
  [*] --> Idle: Reset
  [*] --> Parked: Park
  [*] --> Parked: Stop
  [*] --> Active: Start
  Active --> Idle: Finish
  Active --> Idle: Park
  [*] --> Zero: ZeroOut
  state route <<choice>>
  [*] --> route: Route(value)
  route --> Zero: isEqual($value, 0)
  route --> Other
  note right of Idle
    +Init
  end note`;

const globalActionSteps = [
	['Park', {}, 'Parked'],
	['Finish', {}, 'Parked'],
	['Start', {}, 'Active'],
	['Finish', {}, 'Idle'],
	['Start', {}, 'Active'],
	['Park', {}, 'Idle'],
	['Start', {}, 'Active'],
	['Route', { value: 1 }, 'Other'],
	['Start', {}, 'Active'],
	['Stop', {}, 'Parked'],
	['Route', { value: 0 }, 'Zero'],
	['Route', { value: 1 }, 'Other'],
	['ZeroOut', {}, 'Zero'],
	['Reset', {}, 'Idle'],
] as const;

it.each([
	[ModuleNames.JavaScript, 'js'],
	[ModuleNames.TypeScript, 'ts'],
	[ModuleNames.PureJavaScript, 'js'],
	[ModuleNames.PureTypeScript, 'js'],
] as const)('dispatches every global action from target-only states in %s', async (lang, extension) => {
	const fixture = `global_actions_${lang}`;
	await generateAndSave({ input: globalActionsDiagram, automataName: 'GlobalActions', lang }, fixture);
	const mod = await import(genPath(`${fixture}_generated.${extension}`));
	const machine = mod.GlobalActions ? new mod.GlobalActions() : mod.createGlobalActions();
	expect(machine.state).toBe(mod.statesDictionary.Idle);
	for (const [action, payload, expected] of globalActionSteps) {
		machine.dispatch({ action: mod.actionsDictionary[action], payload });
		expect(machine.state, action).toBe(mod.statesDictionary[expected]);
	}
});

it.runIf(pythonCmd)('dispatches every global action from target-only states in Python', async () => {
	await generateAndSave({ input: globalActionsDiagram, automataName: 'GlobalActions', lang: ModuleNames.Python }, 'global_actions_py');
	const program = `
from global_actions_py_generated import create_global_actions, actions_dictionary, states_dictionary
machine = create_global_actions()
assert machine['state']() == states_dictionary['Idle']
for action, payload, expected in ${JSON.stringify(globalActionSteps)}:
    machine['dispatch']({'action': actions_dictionary[action], 'payload': payload})
    assert machine['state']() == states_dictionary[expected], action
`;
	execFileSync(pythonCmd!, ['-c', program], { cwd: generatedDir, timeout: 10000 });
});

describeExec('shared behavior - Python', async () => {
	await generateAndSave({ input: diagram, automataName: AUTOMATA_NAME, lang: ModuleNames.Python }, 'shared_py');

	function runPy(script: string): string {
		const normalized = script.trim()
			.replace(/\n/g, '; ')
			.replace(/"/g, '\\"');
		return execSync(`${pythonCmd} -c "${normalized}"`, { encoding: 'utf8', timeout: 10000 }).trim();
	}

	it('starts in initial state A after dispatching GO', () => {
		const out = runPy(`
import sys; sys.path.insert(0, r'${generatedDir}')
from shared_py_generated import create_shared_spec, states_dictionary, actions_dictionary
fsm = create_shared_spec()
fsm['dispatch']({'action': actions_dictionary['GO'], 'payload': {}})
assert fsm['state']() == states_dictionary['A'], f"Expected A, got {fsm['state']()}"
print('ok')
`);
		expect(out).toBe('ok');
	});

	it('after GO + STEP: state is B', () => {
		const out = runPy(`
import sys; sys.path.insert(0, r'${generatedDir}')
from shared_py_generated import create_shared_spec, states_dictionary, actions_dictionary
fsm = create_shared_spec()
fsm['dispatch']({'action': actions_dictionary['GO'], 'payload': {}})
fsm['dispatch']({'action': actions_dictionary['STEP'], 'payload': {}})
assert fsm['state']() == states_dictionary['B'], f"Expected B, got {fsm['state']()}"
print('ok')
`);
		expect(out).toBe('ok');
	});

	it('after GO + STEP + STEP: state is C', () => {
		const out = runPy(`
import sys; sys.path.insert(0, r'${generatedDir}')
from shared_py_generated import create_shared_spec, states_dictionary, actions_dictionary
fsm = create_shared_spec()
fsm['dispatch']({'action': actions_dictionary['GO'], 'payload': {}})
fsm['dispatch']({'action': actions_dictionary['STEP'], 'payload': {}})
fsm['dispatch']({'action': actions_dictionary['STEP'], 'payload': {}})
assert fsm['state']() == states_dictionary['C'], f"Expected C, got {fsm['state']()}"
print('ok')
`);
		expect(out).toBe('ok');
	});

	it('after GO + STEP x3: state is back to A', () => {
		const out = runPy(`
import sys; sys.path.insert(0, r'${generatedDir}')
from shared_py_generated import create_shared_spec, states_dictionary, actions_dictionary
fsm = create_shared_spec()
fsm['dispatch']({'action': actions_dictionary['GO'], 'payload': {}})
fsm['dispatch']({'action': actions_dictionary['STEP'], 'payload': {}})
fsm['dispatch']({'action': actions_dictionary['STEP'], 'payload': {}})
fsm['dispatch']({'action': actions_dictionary['STEP'], 'payload': {}})
assert fsm['state']() == states_dictionary['A'], f"Expected A (cycle), got {fsm['state']()}"
print('ok')
`);
		expect(out).toBe('ok');
	});

	it('get_epoch increments with each dispatch', () => {
		const out = runPy(`
import sys; sys.path.insert(0, r'${generatedDir}')
from shared_py_generated import create_shared_spec, actions_dictionary, get_epoch
fsm = create_shared_spec()
before = get_epoch()
fsm['dispatch']({'action': actions_dictionary['GO'], 'payload': {}})
assert get_epoch() == before + 1, f"Expected {before + 1}, got {get_epoch()}"
print('ok')
`);
		expect(out).toBe('ok');
	});

	it('has_state accepts string key', () => {
		const out = runPy(`
import sys; sys.path.insert(0, r'${generatedDir}')
from shared_py_generated import create_shared_spec, actions_dictionary, has_state
fsm = create_shared_spec()
fsm['dispatch']({'action': actions_dictionary['GO'], 'payload': {}})
assert has_state(fsm, 'A') == True, f"Expected True"
assert has_state(fsm, 'B') == False, f"Expected False"
print('ok')
`);
		expect(out).toBe('ok');
	});
});
