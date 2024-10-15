import { GenericAutomata } from '@yantrix/automata';
import { isStaticMethodsAutomata, TClassConstructor } from '@yantrix/utils';
import { isAutomata, isPropsUseFSM } from '../typeGuards';
import { IContextFSM, TAutomata, TUseFSMProps } from '../types';

export const automatasList: Record<string, any> = {};

export const fsm_context: IContextFSM = {
	callbacksIdCounter: 0,
	callbacks: new Map(),
	subscribe: (cb) => {
		const id = ++fsm_context.callbacksIdCounter;
		fsm_context.callbacks.set(id, cb);
		return () => fsm_context.callbacks.delete(id);
	},
	getSnapshot: () => fsm_context.state,
	state: new GenericAutomata(),
	changeState: (newState) => {
		fsm_context.state = newState;
		fsm_context.callbacks.forEach(cb => cb());
	},
	initializeFSM: (Automata: TUseFSMProps<TAutomata> | TClassConstructor<TAutomata>) => {
		if (isAutomata(Automata) && isStaticMethodsAutomata(Automata)) {
			const id = Automata.id;
			fsm_context.changeAutomatas(id, Automata);
			return id;
		} else if (isPropsUseFSM(Automata)) {
			const id = Automata.id;
			fsm_context.changeAutomatas(id, Automata.Automata);
			return id;
		}

		throw new Error('Is not fsm or props');
	},

	changeAutomatas: (id: string, Automata: TClassConstructor<TAutomata>) => {
		if (!automatasList[id]) {
			automatasList[id] = new Automata();
			fsm_context.changeState(automatasList[id]);
		} else {
			fsm_context.changeState(automatasList[id]);
		}
		fsm_context.callbacks.forEach((cb: any) => {
			cb();
		});
	},
};
