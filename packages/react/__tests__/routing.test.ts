import { renderHook } from '@testing-library/react';
import { act, createElement, StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { useFSM, useFSMWithSelector } from '../src';
import { TrafficLightAutomata as TrafficLight } from './generated/TrafficLightAutomata_generated';

describe('react FSM routes', () => {
	it('shares a named instance across both hooks until its last subscriber unmounts', () => {
		const routeName = '__proto__';
		const machine = new TrafficLight();
		const dispatch = machine.dispatch;
		const first = renderHook(() => useFSM(machine, { name: routeName }), { wrapper: StrictMode });
		const second = renderHook(() => useFSMWithSelector(machine, { selector: fsm => fsm.state }));
		const active = second.result.current.getAutomatasList();

		expect(first.result.current.id).toBe(TrafficLight.id);
		expect(second.result.current.getInstanceAutomata().id).toBe('__proto__');
		expect(active[routeName]).toBe(machine);
		first.unmount();
		expect(active[routeName]).toBe(machine);
		act(() => {
			machine.dispatch(TrafficLight.createAction('Switch', {}));
		});
		expect(second.result.current.selection).toBe(TrafficLight.getState('Red'));
		second.unmount();
		expect(active[routeName]).toBeUndefined();
		expect(machine.dispatch).toBe(dispatch);
	});

	it('warns and isolates colliding names, then releases the name for reuse', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		try {
			const north = new TrafficLight();
			const south = new TrafficLight();
			const first = renderHook(() => useFSM(north, { name: 'junction' }));
			const second = renderHook(() => useFSMWithSelector(south, {
				name: 'junction',
				selector: fsm => fsm.state,
			}));
			expect(warn).toHaveBeenCalledOnce();
			expect(warn.mock.calls[0]?.[0]).toContain('junction');
			expect(second.result.current.getInstanceAutomata().id).toBe(south.correlationId);
			expect(second.result.current.getAutomatasList().junction).toBe(north);
			act(() => {
				second.result.current.dispatch(TrafficLight.createAction('Switch', {}));
			});
			expect(first.result.current.state).toBe(TrafficLight.getState('Off'));
			expect(second.result.current.selection).toBe(TrafficLight.getState('Red'));

			first.unmount();
			const third = new TrafficLight();
			const replacement = renderHook(() => useFSM(third, { name: 'junction' }));
			expect(replacement.result.current.getInstanceAutomata().id).toBe('junction');
			expect(second.result.current.getInstanceAutomata().id).toBe(south.correlationId);
			second.unmount();
			replacement.unmount();
		} finally {
			warn.mockRestore();
		}
	});

	it('gives a live machine priority over an alias matching its correlationId', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		try {
			const first = new TrafficLight();
			const second = new TrafficLight();
			const alias = renderHook(() => useFSM(first, { name: second.correlationId }));
			const intrinsic = renderHook(() => useFSM(second, { name: '' }));
			expect(alias.result.current.getInstanceAutomata().id).toBe(first.correlationId);
			expect(intrinsic.result.current.getInstanceAutomata().id).toBe(second.correlationId);
			expect(alias.result.current.getAutomatasList()[second.correlationId]).toBe(second);
			expect(warn).toHaveBeenCalledOnce();
			alias.unmount();
			intrinsic.unmount();
		} finally {
			warn.mockRestore();
		}
	});

	it('does not reserve a name during server rendering', () => {
		const serverMachine = new TrafficLight();
		function ServerView() {
			const result = useFSM(serverMachine, { name: 'ssr-route' });
			return createElement('span', {}, result.getInstanceAutomata().id);
		}

		expect(renderToString(createElement(ServerView))).toContain('ssr-route');
		const clientMachine = new TrafficLight();
		const client = renderHook(() => useFSM(clientMachine, { name: 'ssr-route' }));
		expect(client.result.current.getInstanceAutomata().id).toBe('ssr-route');
		expect(client.result.current.getAutomatasList()['ssr-route']).toBe(clientMachine);
		client.unmount();
	});
});
