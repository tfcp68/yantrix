import { isStaticMethodsAutomata, TClassConstructor } from '@yantrix/utils';
import { isAutomata, isPropsUseFSM } from '../typeGuards';
import { IContextFSM, TAutomata, TUseFSMProps } from '../types';

export const fsm_context: IContextFSM = {
	callbacksIdCounter: 0,
	callbacks: new Map(),
	subscribe: (cb) => {
		const id = ++fsm_context.callbacksIdCounter;
		fsm_context.callbacks.set(id, cb);
		return () => fsm_context.callbacks.delete(id);
	},
	getSnapshot: () => fsm_context.state,
	state: {
		automatas: {},
	},
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
		return '';
	},

	changeAutomatas: (id: string, Automata: TClassConstructor<TAutomata>) => {
		if (!fsm_context.state.automatas[id]) {
			fsm_context.changeState({
				...fsm_context.state,
				automatas: {
					...fsm_context.state.automatas,
					[id]: new Automata(),
				},
			});
		}
		fsm_context.callbacks.forEach((cb: any) => {
			cb();
		});
	},
};
