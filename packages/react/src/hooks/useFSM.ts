import {
	GenericAutomata,
	TAutomataActionPayload,
	TAutomataBaseActionType,
	TAutomataBaseStateType,
} from '@yantrix/automata';
import { isStaticMethodsAutomata, TClassConstructor, TStaticMethods, uniqId } from '@yantrix/utils';
import { createContext, useContext, useRef, useState } from 'react';
import useSyncExternalStoreExports from 'use-sync-external-store/shim';
import { fsm_context } from '../store/store';
import { isAutomata, isPropsUseFSM } from '../typeGuards';
import { IContextFSM, TAutomata, TPreviousContext, TTraceTransaction, TUseFSMProps, TUseFsmReturn } from '../types';

const { useSyncExternalStore } = useSyncExternalStoreExports;

const storeFsm = createContext<IContextFSM>(fsm_context);

const setInitialStaticMethods = (Automata: TUseFSMProps<TAutomata> | TClassConstructor<TAutomata>) => {
	if (isAutomata(Automata) && isStaticMethodsAutomata(Automata)) {
		return {
			...Automata,
		};
	} else if (isPropsUseFSM(Automata)) {
		return {
			...Automata.Automata,
		};
	} else {
		return {
			...GenericAutomata,
		};
	}
};
/**
 * Хук `useFSM` используется для инициализации и управления FSM в контексте React.
 *
 * @template TAutomata Тип автомата, который будет использоваться.
 *
 * @param {TUseFSMProps<TAutomata> | TClassConstructor<TAutomata>} Automata - Класс автомата или его пропсы.
 *
 * @throws {Error} Если автомат не был найден или его состояние не определено.
 *
 * @description
 * Хук выполняет следующие действия:
 * - Инициализирует автомат с использованием переданного класса или пропсов c автоматом и уникальным ID автомата.
 * - Предоставляет методы для управления состоянием автомата, вызова экшенов и отслеживания действий.
 * - Использует `useSyncExternalStore` для синхронизации с контекстом состояния автомата и подписки на его изменения.
 *
 * @example
 * // Пример использования хука useFSM
 * const { state, dispatch, getContext } = useFSM(MyAutomataClass);
 *
 * console.log(state);  // Текущее состояние автомата
 * dispatch({ type: MyActionType, payload: {} });  // Вызов действия
 * const context = getContext();  // Получение текущего контекста автомата
 */
export const useFSM = (Automata: TUseFSMProps<TAutomata> | TClassConstructor<TAutomata>): TUseFsmReturn => {
	const automataStore = useContext<IContextFSM>(storeFsm);
	const isInitializedRef = useRef(false); // Флаг для отслеживания инициализации
	const idFSM = useRef('');

	if (!isInitializedRef.current) {
		// Инициализируем автомат в store'е
		idFSM.current = automataStore.initializeFSM(Automata);
		isInitializedRef.current = true;
	}
	const externalStore = useSyncExternalStore(automataStore.subscribe, automataStore.getSnapshot);

	const fsmStore = externalStore.automatas[idFSM.current] as TAutomata;

	if (!fsmStore || !fsmStore.state) {
		throw new Error('Automata not found or state is undefined');
	}
	if (!fsmStore) {
		throw new Error('Automata not found');
	}

	const [previousContext, setPreviousContext] = useState<TPreviousContext>({
		state: null,
		context: {},
	});
	const [staticMethods] = useState<TStaticMethods>(() => setInitialStaticMethods(Automata) as TStaticMethods);
	const [lastPayload, setLastPayload] = useState<any>();

	const getInstanceAutomata = () => automataStore.state.automatas[idFSM.current];
	const getAutomatasList = () => automataStore.state.automatas;

	const payloadFromDispatch = <ActionType extends number, PayloadType extends { [K in ActionType]: any } >
	(action: TAutomataActionPayload<ActionType, PayloadType>) => {
		setLastPayload(action.payload);
		setPreviousContext(fsmStore.getContext());

		return fsmStore.dispatch(action);
	};

	const trace = (): TTraceTransaction<TAutomataBaseStateType, TAutomataBaseActionType> => {
		return {
			lastPayload,
			previousContext,
			timestamp: new Date(),
			id: uniqId(10),
		};
	};

	return {
		state: fsmStore.state,
		getContext: fsmStore.getContext.bind(fsmStore),
		dispatch: payloadFromDispatch,
		trace,
		getInstanceAutomata,
		getAutomatasList,
		...staticMethods,
	};
};
