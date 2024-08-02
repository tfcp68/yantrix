import { beforeEach, describe, vitest, test, expect } from 'vitest';
import {
	AutomataIncludeNotes,
	actionsDictionary,
	statesDictionary,
} from './fixtures/AutomataIncludeNotes_generated.js';

let automata: AutomataIncludeNotes;

const initialContext = {
	string: 'str',
	integer: 3,
	array: [],
};
// const defaultPayload = {
// 	a1: 'string',
// 	a2: 3,
// 	a3: [],
// };

describe('Automat include notes', () => {
	beforeEach(() => {
		vitest.clearAllTimers();
		vitest.clearAllTimers();
		automata = new AutomataIncludeNotes();
	});
});

// describe('Automata include notes', () => {
// 	beforeEach(() => {
// 		vitest.clearAllTimers();
// 		vitest.clearAllTimers();
// 		automata = new AutomataIncludeNotes();
// 	});

// 	describe('Initial context', () => {
// 		test('Initial context =  string: str, integer: 3, array: [],', () => {
// 			expect(automata.state).toBe(statesDictionary['/~~~START~~~']);
// 			expect(automata.context).toStrictEqual(initialContext);
// 		});
// 	});
// 	describe('Previus context to context', () => {
// 		const toA = { action: actionsDictionary['/toA (a1,a2,a3)'], payload: { ...defaultPayload } };
// 		const toAA = [toA, { action: actionsDictionary['/toAA'], payload: {} }];

// 		test('Assign previus context to current context between states', () => {
// 			automata.setActionQueue(toAA);
// 			automata.consumeAction(toAA.length);

// 			expect(automata.context).toStrictEqual({
// 				...initialContext,
// 				...defaultPayload,
// 			});
// 		});
// 	});
// 	describe('Dispatch action include payload', () => {
// 		describe('Initial assign value', () => {
// 			test('Initial payload,  initial context empty === #{a1,a2, a3} <= (a1=`string`, a2=3, a3=[])', () => {
// 				automata.dispatch({
// 					action: actionsDictionary["/toD (a1='string', a2=3, a3=[])"],
// 					payload: {},
// 				});
// 				expect(automata.context).toStrictEqual({
// 					...initialContext,
// 					...defaultPayload,
// 				});
// 			});
// 			test('Initial payload, initial context === #{a1=[],a2=`string`, a3=3} <= (a1=`string`, a2=3, a3=[])', () => {
// 				automata.dispatch({
// 					action: actionsDictionary["/toF (a1='string', a2=3, a3=[])"],
// 					payload: {},
// 				});
// 				expect(automata.context).toStrictEqual({
// 					...initialContext,
// 					...defaultPayload,
// 				});
// 			});
// 			test('Empty payload, inital context', () => {
// 				automata.dispatch({
// 					action: actionsDictionary['/toH (a1, a2, a3)'],
// 					payload: {},
// 				});
// 				expect(automata.context).toStrictEqual({
// 					...initialContext,
// 					...defaultPayload,
// 				});
// 			});
// 		});
// 		test('From payload to existed initial context #{integer} <= (newInteger)', () => {
// 			automata.dispatch({
// 				action: actionsDictionary['/toC (newInteger)'],
// 				payload: {
// 					newInteger: 300,
// 				},
// 			});
// 			expect(automata.context).toStrictEqual({
// 				...initialContext,
// 				integer: 300,
// 			});
// 		});
// 		test('From empty payload to existed initial context #{integer} <= ({})', () => {
// 			automata.dispatch({
// 				action: actionsDictionary['/toC (newInteger)'],
// 				payload: {},
// 			});
// 			expect(automata.context).toMatchObject({
// 				integer: null,
// 			});
// 		});
// 		test('From payload to new context declaration #{a1,a2,a3} <= (a1,a2,a3)', () => {
// 			automata.dispatch({
// 				action: actionsDictionary['/toB (a1,a2,a3)'],
// 				payload: defaultPayload,
// 			});
// 			expect(automata.context).toStrictEqual({
// 				...defaultPayload,
// 				...initialContext,
// 			});
// 		});
// 		test('From empty payload to new context declaration #{a1,a2,a3} <= ({})', () => {
// 			automata.dispatch({
// 				action: actionsDictionary['/toB (a1,a2,a3)'],
// 				payload: {},
// 			});

// 			expect(automata.context).toStrictEqual({
// 				...initialContext,
// 				a1: null,
// 				a2: null,
// 				a3: null,
// 			});
// 		});
// 	});
// });
