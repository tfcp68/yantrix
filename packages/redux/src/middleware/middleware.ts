import { TCreateMiddleware } from './types';

/**
 * Создает middleware для интеграции конечного автомата (FSM) с Redux.
 * Middleware преобразует действия Redux в payload для FSM и возвращает действия обратно в Redux из контекста FSM.
 *
 * @template ActionType - Тип действия Redux, который должен расширять PayloadAction.
 * @template AutomataType - Тип конструктора конечного автомата (FSM).
 * @template StoreType - Тип хранилища Redux (по умолчанию любой).
 *
 * @param {AutomataType} FSM - Конструктор конечного автомата (FSM), который будет использоваться в middleware.
 * @param {(action: ActionType) => TInferAutomataPayload<AutomataType>} mapActionToFSMPayload - Функция, которая преобразует действие Redux в payload для FSM.
 * Она принимает действие Redux и возвращает объект с типами `{ action, payload }` или `null`, если действие не должно быть обработано FSM.
 * @param {(context: TInferAutomataContext<AutomataType>) => ActionType} mapContextToAction - Функция, которая преобразует контекст FSM обратно в действие Redux.
 * Она принимает контекст FSM и возвращает действие Redux, которое будет диспатчено в Redux хранилище.
 *
 * @returns {Middleware<ActionType, StoreType>} Функция middleware для Redux, которая может быть использована в процессе конфигурации хранилища.
 *
 * @example
 * const middleware = createMiddleware(
 *   TrafficLightAutomata,
 *   (action) => action.type === 'SWITCH' ? { action: 'Switch', payload: null } : null,
 *   (context) => ({
 *     type: 'UPDATE_TRAFFIC_LIGHT',
 *     payload: { state: context.state, counter: context.counter }
 *   })
 * );
 */
export const createMiddleware: TCreateMiddleware = (FSM, mapActionToFSMPayload, mapContextToAction) => {
	const fsmInstance = new FSM();
	return () => next => (action) => {
		const fsmPayload = mapActionToFSMPayload(action as any);

		if (fsmPayload) {
			fsmInstance.dispatch(fsmPayload);
		}

		const newAction = mapContextToAction(fsmInstance.getContext());

		return next(newAction);
	};
};
