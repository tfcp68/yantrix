import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ModuleNames } from '@yantrix/codegen';
import { describe, expect, it } from 'vitest';
import { generateAndSave, generateAutomata } from './fixtures/utils.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const generatedDir = path.resolve(dirname, 'fixtures/generated');

const trafficInput = `stateDiagram-v2
	[*] --> Off: Reset (initialCounter=0)
	Off --> Red: Switch
	Red --> RedYellow: Switch
	RedYellow --> Green: Switch
	Green --> Yellow: Switch
	Yellow --> Red: Switch
note right of [*]
#{ counter = 0 } <= coalesce($initialCounter, inc(#counter = 0))
end note
note left of Off
+Init
end note
`;

function isPythonAvailable(): string | null {
	for (const cmd of ['python3', 'python']) {
		try {
			execSync(`${cmd} --version`, { stdio: 'ignore' });
			try {
				execSync(`${cmd} -c "import pydash; from pydash import gt, lt"`, { stdio: 'ignore' });
			} catch {
				return null;
			}
			return cmd;
		} catch {
			// try next
		}
	}
	return null;
}

const pythonCmd = isPythonAvailable();
const describeExec = pythonCmd ? describe : describe.skip;

describe('python codegen - structural validation', async () => {
	const code = await generateAutomata({
		input: trafficInput,
		automataName: 'TrafficLight',
		lang: ModuleNames.Python,
	});

	it('generates states_dictionary', () => {
		expect(code).toContain('states_dictionary = {');
	});

	it('generates actions_dictionary', () => {
		expect(code).toContain('actions_dictionary = {');
	});

	it('generates action_to_state_from_state_dict', () => {
		expect(code).toContain('action_to_state_from_state_dict = {');
	});

	it('generates Off state hash', () => {
		expect(code).toContain('79183');
	});

	it('generates Red state hash', () => {
		expect(code).toContain('82033');
	});

	it('generates reducer functions', () => {
		expect(code).toMatch(/def _reducer_\d+/);
	});

	it('generates _get_default_context', () => {
		expect(code).toContain('def _get_default_context(prev_context, payload)');
	});

	it('generates factory function', () => {
		expect(code).toContain('def create_traffic_light():');
	});

	it('factory returns dict with state key', () => {
		expect(code).toContain('\'state\': lambda: _state[0]');
	});

	it('generates helper functions', () => {
		expect(code).toContain('def get_state(name):');
		expect(code).toContain('def get_action(name):');
		expect(code).toContain('def create_action(name, payload):');
		expect(code).toContain('def has_state(instance, state_name):');
		expect(code).toContain('def get_epoch():');
	});

	it('generates function_dictionary', () => {
		expect(code).toContain('function_dictionary = {');
	});

	it('context uses coalesce in default context', () => {
		expect(code).toContain('function_dictionary[\'coalesce\']');
	});

	it('context uses inc builtin', () => {
		expect(code).toContain('function_dictionary[\'inc\']');
	});
});

describe('python codegen - builtin functions structural', async () => {
	const fnInput = `stateDiagram-v2
	[*] --> Active: Start
	Active --> Active: Update
note left of Active
	+Init
	#{ doubled = 0 } <= mult($val, 2)
	#{ clamped = 0 } <= if(isGreater($v, 100), 100, $v)
end note
`;

	const code = await generateAutomata({
		input: fnInput,
		automataName: 'BuiltinFns',
		lang: ModuleNames.Python,
	});

	it('generates mult call in reducer', () => {
		expect(code).toContain('function_dictionary[\'mult\']');
	});

	it('generates is_greater call in reducer', () => {
		expect(code).toContain('function_dictionary[\'is_greater\']');
	});

	it('generates _if call in reducer', () => {
		expect(code).toContain('function_dictionary[\'_if\']');
	});
});

describe('python codegen - define directive structural', async () => {
	const defineInput = `stateDiagram-v2
	[*] --> S: go
	S --> S: next
note left of S
	+Init
	define/double(x) => mult(x, 2)
	#{ result = 0 } <= double($n)
end note
`;

	const code = await generateAutomata({
		input: defineInput,
		automataName: 'DefineTest',
		lang: ModuleNames.Python,
	});

	it('registers user-defined double function', () => {
		expect(code).toContain('function_dictionary[\'double\']');
	});

	it('double calls mult', () => {
		expect(code).toContain('function_dictionary[\'mult\']');
	});
});

describe('python codegen - inject functions', async () => {
	const injectPath = path.resolve(dirname, 'fixtures/injects/correctFunctions.py');
	const code = await generateAutomata({
		input: trafficInput,
		automataName: 'TrafficLight',
		lang: ModuleNames.Python,
		injects: injectPath,
	});

	it('includes injected function assignment', () => {
		expect(code).toContain('function_dictionary[\'triple\']');
	});

	it('injected function body references mult', () => {
		expect(code).toContain('function_dictionary[\'mult\']');
	});
});

describeExec('python codegen - inject functions execution', async () => {
	const injectPath = path.resolve(dirname, 'fixtures/injects/correctFunctions.py');
	await generateAndSave(
		{ input: trafficInput, automataName: 'TrafficLight', lang: ModuleNames.Python, injects: injectPath },
		'py_inject',
	);

	const pyFile = path.join(generatedDir, 'py_inject_generated.py');

	it('generated inject file exists', () => {
		expect(fs.existsSync(pyFile)).toBe(true);
	});

	it('injected triple function triples a value', () => {
		const script = `
import sys
sys.path.insert(0, r'${generatedDir}')
from py_inject_generated import function_dictionary
result = function_dictionary['triple'](3)
assert result == 9, f"Expected 9, got {result}"
print('ok')
`.trim();
		const out = execSync(`${pythonCmd} -c "${script.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { encoding: 'utf8', timeout: 10000 });
		expect(out.trim()).toBe('ok');
	});
});

describeExec('python codegen - execution', async () => {
	await generateAndSave(
		{ input: trafficInput, automataName: 'TrafficLight', lang: ModuleNames.Python },
		'py_traffic',
	);

	const pyFile = path.join(generatedDir, 'py_traffic_generated.py');

	it('generated file exists', () => {
		expect(fs.existsSync(pyFile)).toBe(true);
	});

	it('factory creates instance with correct initial state', () => {
		const script = `
import sys
sys.path.insert(0, r'${generatedDir}')
from py_traffic_generated import create_traffic_light, states_dictionary
fsm = create_traffic_light()
assert fsm['state']() == states_dictionary['Off'], f"Expected Off, got {fsm['state']()}"
print('ok')
`.trim();
		const out = execSync(`${pythonCmd} -c "${script.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { encoding: 'utf8', timeout: 10000 });
		expect(out.trim()).toBe('ok');
	});

	it('dispatch transitions state from Off to Red', () => {
		const script = `
import sys
sys.path.insert(0, r'${generatedDir}')
from py_traffic_generated import create_traffic_light, states_dictionary, actions_dictionary
fsm = create_traffic_light()
fsm['dispatch']({'action': actions_dictionary['Switch'], 'payload': {}})
assert fsm['state']() == states_dictionary['Red'], f"Expected Red, got {fsm['state']()}"
print('ok')
`.trim();
		const out = execSync(`${pythonCmd} -c "${script.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { encoding: 'utf8', timeout: 10000 });
		expect(out.trim()).toBe('ok');
	});

	it('dispatch increments current_cycle', () => {
		const script = `
import sys
sys.path.insert(0, r'${generatedDir}')
from py_traffic_generated import create_traffic_light, actions_dictionary
fsm = create_traffic_light()
fsm['dispatch']({'action': actions_dictionary['Switch'], 'payload': {}})
assert fsm['current_cycle']() == 1, f"Expected 1, got {fsm['current_cycle']()}"
print('ok')
`.trim();
		const out = execSync(`${pythonCmd} -c "${script.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { encoding: 'utf8', timeout: 10000 });
		expect(out.trim()).toBe('ok');
	});

	it('counter increments on each dispatch via coalesce/inc', () => {
		const script = `
import sys
sys.path.insert(0, r'${generatedDir}')
from py_traffic_generated import create_traffic_light, actions_dictionary
fsm = create_traffic_light()
fsm['dispatch']({'action': actions_dictionary['Switch'], 'payload': {}})
fsm['dispatch']({'action': actions_dictionary['Switch'], 'payload': {}})
ctx = fsm['get_context']()['context']
assert ctx['counter'] == 2, f"Expected 2, got {ctx['counter']}"
print('ok')
`.trim();
		const out = execSync(`${pythonCmd} -c "${script.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { encoding: 'utf8', timeout: 10000 });
		expect(out.trim()).toBe('ok');
	});

	it('unknown action does not change state', () => {
		const script = `
import sys
sys.path.insert(0, r'${generatedDir}')
from py_traffic_generated import create_traffic_light, states_dictionary
fsm = create_traffic_light()
before = fsm['state']()
fsm['dispatch']({'action': -999, 'payload': {}})
assert fsm['state']() == before, f"State changed unexpectedly"
print('ok')
`.trim();
		const out = execSync(`${pythonCmd} -c "${script.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { encoding: 'utf8', timeout: 10000 });
		expect(out.trim()).toBe('ok');
	});

	it('paused machine queues dispatches', () => {
		const script = `
import sys
sys.path.insert(0, r'${generatedDir}')
from py_traffic_generated import create_traffic_light, states_dictionary, actions_dictionary
fsm = create_traffic_light()
fsm['pause']()
fsm['dispatch']({'action': actions_dictionary['Switch'], 'payload': {}})
assert fsm['state']() == states_dictionary['Off'], f"Expected Off while paused"
print('ok')
`.trim();
		const out = execSync(`${pythonCmd} -c "${script.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { encoding: 'utf8', timeout: 10000 });
		expect(out.trim()).toBe('ok');
	});

	it('resume flushes queued dispatches', () => {
		const script = `
import sys
sys.path.insert(0, r'${generatedDir}')
from py_traffic_generated import create_traffic_light, states_dictionary, actions_dictionary
fsm = create_traffic_light()
fsm['pause']()
fsm['dispatch']({'action': actions_dictionary['Switch'], 'payload': {}})
fsm['resume']()
assert fsm['state']() == states_dictionary['Red'], f"Expected Red after resume, got {fsm['state']()}"
print('ok')
`.trim();
		const out = execSync(`${pythonCmd} -c "${script.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { encoding: 'utf8', timeout: 10000 });
		expect(out.trim()).toBe('ok');
	});

	it('disabled machine ignores dispatches', () => {
		const script = `
import sys
sys.path.insert(0, r'${generatedDir}')
from py_traffic_generated import create_traffic_light, states_dictionary, actions_dictionary
fsm = create_traffic_light()
fsm['disable']()
fsm['dispatch']({'action': actions_dictionary['Switch'], 'payload': {}})
assert fsm['state']() == states_dictionary['Off'], f"Expected Off while disabled"
print('ok')
`.trim();
		const out = execSync(`${pythonCmd} -c "${script.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { encoding: 'utf8', timeout: 10000 });
		expect(out.trim()).toBe('ok');
	});
});

describeExec('python codegen - builtin functions execution', async () => {
	const fnInput = `stateDiagram-v2
	[*] --> Active: Start
	Active --> Active: Update
note left of Active
	+Init
	#{ doubled = 0 } <= mult($val, 2)
	#{ clamped = 0 } <= if(isGreater($v, 100), 100, $v)
end note
`;
	await generateAndSave(
		{ input: fnInput, automataName: 'PyBuiltins', lang: ModuleNames.Python },
		'py_builtins',
	);

	it('mult builtin computes correctly', () => {
		const script = `
import sys
sys.path.insert(0, r'${generatedDir}')
from py_builtins_generated import create_py_builtins, actions_dictionary
fsm = create_py_builtins()
fsm['dispatch']({'action': actions_dictionary['Update'], 'payload': {'val': 5, 'v': 42}})
ctx = fsm['get_context']()['context']
assert ctx['doubled'] == 10, f"Expected 10, got {ctx['doubled']}"
print('ok')
`.trim();
		const out = execSync(`${pythonCmd} -c "${script.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { encoding: 'utf8', timeout: 10000 });
		expect(out.trim()).toBe('ok');
	});

	it('isGreater + if builtins clamp correctly', () => {
		const script = `
import sys
sys.path.insert(0, r'${generatedDir}')
from py_builtins_generated import create_py_builtins, actions_dictionary
fsm = create_py_builtins()
fsm['dispatch']({'action': actions_dictionary['Update'], 'payload': {'val': 1, 'v': 150}})
ctx = fsm['get_context']()['context']
assert ctx['clamped'] == 100, f"Expected 100, got {ctx['clamped']}"
print('ok')
`.trim();
		const out = execSync(`${pythonCmd} -c "${script.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { encoding: 'utf8', timeout: 10000 });
		expect(out.trim()).toBe('ok');
	});
});

describeExec('python codegen - define directive execution', async () => {
	const defineInput = `stateDiagram-v2
	[*] --> S: go
	S --> S: next
note left of S
	+Init
	define/double(x) => mult(x, 2)
	#{ result = 0 } <= double($n)
end note
`;
	await generateAndSave(
		{ input: defineInput, automataName: 'PyDefine', lang: ModuleNames.Python },
		'py_define',
	);

	it('user-defined double function computes correctly', () => {
		const script = `
import sys
sys.path.insert(0, r'${generatedDir}')
from py_define_generated import create_py_define, actions_dictionary
fsm = create_py_define()
fsm['dispatch']({'action': actions_dictionary['next'], 'payload': {'n': 7}})
ctx = fsm['get_context']()['context']
assert ctx['result'] == 14, f"Expected 14, got {ctx['result']}"
print('ok')
`.trim();
		const out = execSync(`${pythonCmd} -c "${script.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { encoding: 'utf8', timeout: 10000 });
		expect(out.trim()).toBe('ok');
	});
});

describeExec('python codegen - helper functions execution', async () => {
	it('get_state returns correct state value', () => {
		const script = `
import sys
sys.path.insert(0, r'${generatedDir}')
from py_traffic_generated import get_state, states_dictionary
result = get_state('Off')
assert result == states_dictionary['Off'], f"Expected Off hash, got {result}"
print('ok')
`.trim();
		const out = execSync(`${pythonCmd} -c "${script.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { encoding: 'utf8', timeout: 10000 });
		expect(out.trim()).toBe('ok');
	});

	it('get_action returns correct action value', () => {
		const script = `
import sys
sys.path.insert(0, r'${generatedDir}')
from py_traffic_generated import get_action, actions_dictionary
result = get_action('Switch')
assert result == actions_dictionary['Switch'], f"Expected Switch hash, got {result}"
print('ok')
`.trim();
		const out = execSync(`${pythonCmd} -c "${script.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { encoding: 'utf8', timeout: 10000 });
		expect(out.trim()).toBe('ok');
	});

	it('create_action returns correct action packet', () => {
		const script = `
import sys
sys.path.insert(0, r'${generatedDir}')
from py_traffic_generated import create_action, actions_dictionary
ap = create_action('Switch', {'x': 1})
assert ap['action'] == actions_dictionary['Switch'], f"Expected Switch action"
assert ap['payload'] == {'x': 1}, f"Expected payload"
print('ok')
`.trim();
		const out = execSync(`${pythonCmd} -c "${script.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { encoding: 'utf8', timeout: 10000 });
		expect(out.trim()).toBe('ok');
	});

	it('has_state returns True for current state', () => {
		const script = `
import sys
sys.path.insert(0, r'${generatedDir}')
from py_traffic_generated import create_traffic_light, has_state
fsm = create_traffic_light()
assert has_state(fsm, 'Off') == True, f"Expected True"
print('ok')
`.trim();
		const out = execSync(`${pythonCmd} -c "${script.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { encoding: 'utf8', timeout: 10000 });
		expect(out.trim()).toBe('ok');
	});

	it('has_state returns False for non-current state', () => {
		const script = `
import sys
sys.path.insert(0, r'${generatedDir}')
from py_traffic_generated import create_traffic_light, has_state
fsm = create_traffic_light()
assert has_state(fsm, 'Red') == False, f"Expected False"
print('ok')
`.trim();
		const out = execSync(`${pythonCmd} -c "${script.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { encoding: 'utf8', timeout: 10000 });
		expect(out.trim()).toBe('ok');
	});
});
