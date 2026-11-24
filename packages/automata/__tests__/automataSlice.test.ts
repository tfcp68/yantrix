import { describe, expect, it, vi } from 'vitest';
import { AutomataSlice, IAutomata, TAutomataStateContext } from '../src';

enum TestEvent {
	Add = 1,
	Rename = 2,
}

interface ITestMeta extends Record<TestEvent, unknown> {
	[TestEvent.Add]: { amount: number };
	[TestEvent.Rename]: { name: string };
}

interface ITestModel {
	count: number;
}

type TTestMachine = IAutomata<number, number, TestEvent>;

function createMachine(id: string, state = 1): TTestMachine {
	let currentState = state;
	let currentContext: object = { value: state };
	return {
		correlationId: id,
		eventAdapter: null,
		getContext: () => ({ state: currentState, context: currentContext }),
		setContext: vi.fn((next: TAutomataStateContext<number, Record<number, any>>) => {
			currentState = next.state ?? currentState;
			currentContext = next.context ?? currentContext;
		}),
		pause: vi.fn(),
		resume: vi.fn(),
		enable: vi.fn(),
	} as unknown as TTestMachine;
}

describe('automataSlice', () => {
	it('owns a named set of machines and exposes their composite state', () => {
		const slice = new AutomataSlice<ITestModel, TestEvent, ITestMeta>({ id: 'gameplay' });
		const first = createMachine('first', 1);
		const second = createMachine('second', 2);

		slice.addMachine('first', first).addMachine('second', second);

		expect(slice.getMachines()).toEqual({ first, second });
		expect(slice.getCompositeState()).toEqual({
			first: { state: 1, context: { value: 1 } },
			second: { state: 2, context: { value: 2 } },
		});
	});

	it('rejects duplicate machine ids and supports idempotent removal', () => {
		const slice = new AutomataSlice<ITestModel, TestEvent, ITestMeta>({ id: 'gameplay' });
		const machine = createMachine('first');
		slice.addMachine('first', machine);

		expect(() => slice.addMachine('first', machine)).toThrow('already registered');
		expect(() => slice.removeMachine('first').removeMachine('first')).not.toThrow();
	});

	it('restores one or all machine states', () => {
		const slice = new AutomataSlice<ITestModel, TestEvent, ITestMeta>({ id: 'gameplay' });
		const first = createMachine('first');
		const second = createMachine('second');
		slice.addMachine('first', first).addMachine('second', second);

		slice.restoreState('first', { state: 3, context: { value: 3 } });
		slice.restoreCompositeState({
			first: { state: 4, context: { value: 4 } },
			second: { state: 5, context: { value: 5 } },
		});

		expect(slice.getCompositeState()).toEqual({
			first: { state: 4, context: { value: 4 } },
			second: { state: 5, context: { value: 5 } },
		});
	});

	it('owns an Effect Matrix without exposing mutable Effect arrays', () => {
		const add = vi.fn((event, model: Readonly<ITestModel>) => ({
			...model,
			count: model.count + (event.meta?.amount ?? 0),
		}));
		const slice = new AutomataSlice<ITestModel, TestEvent, ITestMeta>({
			id: 'gameplay',
			effectMatrix: { [TestEvent.Add]: [add] },
		});

		const matrix = slice.getEventMatrix();
		(matrix[TestEvent.Add] as unknown[]).length = 0;

		expect(slice.getEventEffects(TestEvent.Add)).toEqual([add]);
	});

	it('queues Events while stopped and consumes their Effects after start', () => {
		const add = vi.fn();
		const rename = vi.fn();
		const slice = new AutomataSlice<ITestModel, TestEvent, ITestMeta>({
			id: 'gameplay',
			effectMatrix: {
				[TestEvent.Add]: [add],
				[TestEvent.Rename]: [rename],
			},
		});
		slice
			.dispatchEvent({ event: TestEvent.Add, meta: { amount: 2 } })
			.dispatchEvent({ event: TestEvent.Rename, meta: { name: 'new' } });

		expect(slice.consumeEvent()).toEqual({ events: [], effects: [] });
		expect(slice.getEventStack()).toHaveLength(2);

		slice.start();
		const batch = slice.consumeEvent();
		expect(batch.events.map(event => event.event)).toEqual([TestEvent.Add, TestEvent.Rename]);
		expect(batch.effects).toEqual([add, rename]);
		expect(slice.getEventStack()).toEqual([]);
	});

	it('controls machine lifecycle and optionally clears queued Events on stop', () => {
		const slice = new AutomataSlice<ITestModel, TestEvent, ITestMeta>({ id: 'gameplay' });
		const machine = createMachine('first');
		slice.addMachine('first', machine);
		slice.dispatchEvent({ event: TestEvent.Add, meta: { amount: 1 } });

		slice.start().stop(true);

		expect(machine.enable).toHaveBeenCalledOnce();
		expect(machine.resume).toHaveBeenCalledOnce();
		expect(machine.pause).toHaveBeenCalledOnce();
		expect(slice.getEventStack()).toEqual([]);
		expect(slice.isRunning()).toBe(false);
	});
});
