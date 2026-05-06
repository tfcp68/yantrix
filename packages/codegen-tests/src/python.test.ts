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

describe('python codegen - no pydash, selective functions', async () => {
	const fnInput = `stateDiagram-v2
	[*] --> Active: Start
	Active --> Active: Update
note left of Active
	+Init
	#{ doubled = 0 } <= mult($val, 2)
end note
`;
	const code = await generateAutomata({
		input: fnInput,
		automataName: 'SelectiveFns',
		lang: ModuleNames.Python,
	});

	it('no pydash import in output', () => {
		expect(code).not.toContain('pydash');
	});

	it('mult is present in function_dictionary', () => {
		expect(code).toContain('\'mult\': mult');
	});

	it('unused functions not emitted (sort not used)', () => {
		expect(code).not.toContain('\'sort\': sort');
	});

	it('event_dictionary is emitted', () => {
		expect(code).toContain('event_dictionary = {');
	});

	it('_EventBus class is emitted', () => {
		expect(code).toContain('class _EventBus:');
	});

	it('_EventAdapter class is emitted', () => {
		expect(code).toContain('class _EventAdapter:');
	});

	it('create_event_bus function is emitted', () => {
		expect(code).toContain('def create_event_bus(');
	});

	it('factory returns event_adapter key', () => {
		expect(code).toContain('\'event_adapter\': event_adapter');
	});

	it('no pydash in traffic input either', async () => {
		const trafficCode = await generateAutomata({
			input: trafficInput,
			automataName: 'TrafficLight',
			lang: ModuleNames.Python,
		});
		expect(trafficCode).not.toContain('pydash');
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

const eventAdapterInput = `stateDiagram-v2
	[*] --> Idle: Reset
	Idle --> Active: Trigger
note left of Idle
	+Init
	subscribe/BusReady Trigger
end note
note left of Active
	emit/FsmDone
end note
`;

describe('python codegen - event adapter structural', async () => {
	const code = await generateAutomata({
		input: eventAdapterInput,
		automataName: 'EventFsm',
		lang: ModuleNames.Python,
	});

	it('emits event_adapter = _EventAdapter()', () => {
		expect(code).toContain('event_adapter = _EventAdapter()');
	});

	it('wires add_event_listener for subscribe', () => {
		expect(code).toContain('event_adapter.add_event_listener');
	});

	it('wires add_event_emitter for emit', () => {
		expect(code).toContain('event_adapter.add_event_emitter');
	});

	it('event_adapter in factory return dict', () => {
		expect(code).toContain('\'event_adapter\': event_adapter');
	});

	it('create_event_bus function is emitted', () => {
		expect(code).toContain('def create_event_bus(');
	});

	it('_EventBus class is emitted', () => {
		expect(code).toContain('class _EventBus:');
	});

	it('_EventAdapter class is emitted', () => {
		expect(code).toContain('class _EventAdapter:');
	});

	it('busReady event in event_dictionary', () => {
		expect(code).toContain('BusReady');
	});

	it('fsmDone event in event_dictionary', () => {
		expect(code).toContain('FsmDone');
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

// Diagrams for event bus tests
// Sender: Off -> On (Send action); On state emits FsmSignal
const senderInput = `stateDiagram-v2
	[*] --> Off: Reset
	Off --> On: Send
note left of Off
	+Init
end note
note left of On
	emit/FsmSignal
end note
`;

// Receiver: Idle -> Active (Trigger action); subscribes to FsmSignal -> Trigger
const receiverInput = `stateDiagram-v2
	[*] --> Idle: Reset
	Idle --> Active: Trigger
note left of Idle
	+Init
	subscribe/FsmSignal Trigger
end note
`;

describeExec('python codegen - event bus execution: subscribe triggers transition', async () => {
	await generateAndSave(
		{ input: senderInput, automataName: 'Sender', lang: ModuleNames.Python },
		'py_sender',
	);
	await generateAndSave(
		{ input: receiverInput, automataName: 'Receiver', lang: ModuleNames.Python },
		'py_receiver',
	);

	it('create_event_bus wires two automatas', () => {
		const script = `
import sys
sys.path.insert(0, r'${generatedDir}')
from py_receiver_generated import create_receiver, states_dictionary, create_event_bus
bus, autos, cleanup = create_event_bus('test', {'r': create_receiver})
assert autos['r']['state']() == states_dictionary['Idle'], f"Expected Idle"
print('ok')
`.trim();
		const out = execSync(`${pythonCmd} -c "${script.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { encoding: 'utf8', timeout: 10000 });
		expect(out.trim()).toBe('ok');
	});

	it('dispatching FsmSignal event triggers Receiver Trigger action', () => {
		const script = `
import sys
sys.path.insert(0, r'${generatedDir}')
from py_receiver_generated import create_receiver, states_dictionary, event_dictionary, create_event_bus
bus, autos, cleanup = create_event_bus('test', {'r': create_receiver})
bus.dispatch({'event': event_dictionary['FsmSignal'], 'meta': {}})
assert autos['r']['state']() == states_dictionary['Active'], f"Expected Active, got {autos['r']['state']()}"
print('ok')
`.trim();
		const out = execSync(`${pythonCmd} -c "${script.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { encoding: 'utf8', timeout: 10000 });
		expect(out.trim()).toBe('ok');
	});

	it('cleanup unsubscribes all handlers - dispatch after cleanup has no effect', () => {
		const script = `
import sys
sys.path.insert(0, r'${generatedDir}')
from py_receiver_generated import create_receiver, states_dictionary, event_dictionary, create_event_bus
bus, autos, cleanup = create_event_bus('test', {'r': create_receiver})
cleanup()
bus.dispatch({'event': event_dictionary['FsmSignal'], 'meta': {}})
assert autos['r']['state']() == states_dictionary['Idle'], f"Expected Idle after cleanup, got {autos['r']['state']()}"
print('ok')
`.trim();
		const out = execSync(`${pythonCmd} -c "${script.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { encoding: 'utf8', timeout: 10000 });
		expect(out.trim()).toBe('ok');
	});
});

describeExec('python codegen - event bus execution: emit propagates to second FSM', async () => {
	it('dispatching Send action on Sender emits FsmSignal which transitions Receiver', () => {
		const script = `
import sys
sys.path.insert(0, r'${generatedDir}')
from py_sender_generated import create_sender, actions_dictionary as sender_actions, event_dictionary
from py_receiver_generated import create_receiver, states_dictionary as recv_states, create_event_bus
bus, autos, cleanup = create_event_bus('test', {'s': create_sender, 'r': create_receiver})
autos['s']['dispatch']({'action': sender_actions['Send'], 'payload': {}})
emitted = autos['s']['event_adapter'].handle_transition(autos['s']['get_context']())
bus.dispatch(*emitted)
assert autos['r']['state']() == recv_states['Active'], f"Expected Active, got {autos['r']['state']()}"
print('ok')
`.trim();
		const out = execSync(`${pythonCmd} -c "${script.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { encoding: 'utf8', timeout: 10000 });
		expect(out.trim()).toBe('ok');
	});
});

describeExec('python codegen - event dispatch sequence', async () => {
	it('cascading: Sender dispatch -> emit -> Receiver transition in one bus.dispatch call', () => {
		const script = `
import sys
sys.path.insert(0, r'${generatedDir}')
from py_sender_generated import create_sender, actions_dictionary as sa, event_dictionary
from py_receiver_generated import create_receiver, states_dictionary as rs, create_event_bus
bus, autos, cleanup = create_event_bus('combined', {'s': create_sender, 'r': create_receiver})
before_r_cycle = autos['r']['current_cycle']()
autos['s']['dispatch']({'action': sa['Send'], 'payload': {}})
emits = autos['s']['event_adapter'].handle_transition(autos['s']['get_context']())
bus.dispatch(*emits)
after_r_cycle = autos['r']['current_cycle']()
assert after_r_cycle == before_r_cycle + 1, f'Receiver cycle did not increment: {before_r_cycle} -> {after_r_cycle}'
print('ok')
`.trim();
		const out = execSync(`${pythonCmd} -c "${script.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { encoding: 'utf8', timeout: 10000 });
		expect(out.trim()).toBe('ok');
	});

	it('no infinite loop: single dispatch causes exactly one transition, no cascade', () => {
		// Receiver subscribes to FsmSignal -> Trigger; Active has no emitter.
		// One dispatch must result in exactly one cycle - no cascading loop.
		const script = `
import sys
sys.path.insert(0, r'${generatedDir}')
from py_receiver_generated import create_receiver, states_dictionary, event_dictionary, create_event_bus
bus, autos, cleanup = create_event_bus('test', {'r': create_receiver})
bus.dispatch({'event': event_dictionary['FsmSignal'], 'meta': {}})
assert autos['r']['current_cycle']() == 1, f'Expected 1 cycle, got {autos["r"]["current_cycle"]()}'
assert autos['r']['state']() == states_dictionary['Active'], f'Expected Active'
print('ok')
`.trim();
		const out = execSync(`${pythonCmd} -c "${script.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { encoding: 'utf8', timeout: 10000 });
		expect(out.trim()).toBe('ok');
	});
});
