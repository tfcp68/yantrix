import { createSlice, PayloadAction, SliceSelectors } from '@reduxjs/toolkit';
import { isStaticMethodsAutomata } from '@yantrix/utils';
import { TAutomata, TAutomataContext, TCreateFSMSliceOptions, TReducersFSMSlice } from '../types';

/**
 * Функция для создания обертки над redux slice.
 * Хранит в себе текущее состояни автомата, возвращает готовый слайс с редьюсерами,
 * которые соответствуют action's автомата
 * @template Actions Тип, представляющий возможные действия автомата (string | number | symbol).
 *  @template ContextReduxType Тип контекста, который сохраняется в redux.
 *  @template Automata Тип самого автомата, который должен реализовать TAutomata.
 *  @param {TCreateFSMSliceOptions<Automata, ContextReduxType>} options
 *  Опции для создания слайса:
 *
 *  @param {TClassConstructor<Automata>} options.Fsm
 *  Класс автомата, который используется для инициализации FSM и определения его действий и состояний.
 *
 *  @param {string} options.name
 *  Имя создаваемого слайса, используемое в redux store.
 *
 *  @param {string} [options.reducerPath]
 *  Путь для редьюсера, который может использоваться для размещения редьюсера в иерархии состояний.
 *
 *  @param {(context: ContextType) => StateType} [options.contextToRedux]
 *  Функция, преобразующая контекст автомата в контекст Redux, чтобы синхронизировать данные между
 *  автоматом и redux store. Если не указана, контекст автомата будет использоваться без изменений.
 *
 *  @param {SliceSelectors<TAutomataContext<ContextReduxType>>} [options.selectors]
 *  Набор селекторов для доступа к данным слайса из состояния Redux.
 *  @returns {ReturnType<typeof createSlice>}
 * Созданный redux slice, содержащий редьюсеры, соответствующие действиям автомата, и селекторы.
 *  @example
 *  // Пример использования с автоматом TrafficLightAutomata:
 *  const trafficLightSlice = createFSMSlice({
 *  Fsm: TrafficLightAutomata,
 *  name: 'trafficLight',
 *  contextToRedux: (context) => ({ color: context.state, count: context.counter }),
 *  selectors: {
 *  selectColor: (state) => state.trafficLight.color,
 *  selectCounter: (state) => state.trafficLight.counter,
 *  },
 *  });
 *
 *  // Доступ к действиям автомата через dispatch:
 *  dispatch(trafficLightSlice.actions.Switch({}));
 *
 *  @description
 *  Функция оборачивает автомат в redux slice, сохраняя текущее состояние автомата и контекст.
 *  Каждое действие автомата автоматически вызывает соответствующий редьюсер в созданном слайсе.
 *  Такой подход обеспечивает декомпозицию и автоматизацию логики конечного автомата
 *  в структуре redux store.
 */
export function createFSMSlice<Actions extends string
	| number
	| symbol, ContextReduxType extends object, Automata extends TAutomata = TAutomata>(
	options: TCreateFSMSliceOptions<Automata, ContextReduxType>,
) {
	const { Fsm, name, contextToRedux, selectors, reducerPath } = options;
	const _fsm = new Fsm();
	let reducers;
	let actionsNameList;
	const selectorsSlice = Object.assign(selectors ?? {});

	const contextAutomata: TAutomataContext<ContextReduxType> = _fsm.getContext();
	const contextRedux = Object.assign({}, contextToRedux?.(contextAutomata) ?? {});

	if (isStaticMethodsAutomata(Fsm)) {
		actionsNameList = Object.keys(Fsm.actions);
		reducers = actionsNameList.reduce((acc, actionName) => {
			acc[actionName]
				= (
					_state: TAutomataContext<ContextReduxType>,
					action: PayloadAction<(typeof contextAutomata)['context']>,
				) => {
					const { state, context } = _fsm.dispatch({
						action: Fsm.getAction(actionName),
						payload: action.payload,
					});

					// Прокидываем в маппер контекст из автомата, если contextToRedux неопределен,
					// то прокидываем просто контекст из автомата
					const newSliceContext = contextToRedux?.({
						state,
						...context,
					}) ?? { ...contextAutomata.context };

					_state.context = {
						...newSliceContext,
					};
					_state.state = state;
				};
			return acc;
		}, {} as any);
	}

	return createSlice<TAutomataContext<ContextReduxType>, TReducersFSMSlice<Actions, TAutomataContext<ContextReduxType>['context']>, string, SliceSelectors<TAutomataContext<ContextReduxType>>, string>({
		name,
		reducerPath: reducerPath ?? '',
		initialState: contextRedux as TAutomataContext<ContextReduxType>,
		reducers,
		selectors: selectorsSlice,
	});
}
