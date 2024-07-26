package org.example;
import org.example.types.*;
import org.example.types.automata.*;
import org.example.types.automata.AutomataTypes.*;
import java.util.Map;
import java.util.Objects;

            public final class GeneratedAutomata
            extends GenericAutomata<
                TAutomataBaseStateType, TAutomataBaseActionType, TAutomataBaseEventType,
                TAutomataContextType, TAutomataPayloadType, TAutomataEventMetaType
            > {
                
            private final Map<String, TAutomataBaseStateType> statesDictionary = Map.of(
                "/~~~START~~~", TAutomataBaseState.of(1696941163L),
"/INIT", TAutomataBaseState.of(45657535L),
"/INTRO", TAutomataBaseState.of(1415394173L),
"/MAIN_MENU", TAutomataBaseState.of(1918712022L),
"/~~~END~~~", TAutomataBaseState.of(2004485394L),
"/GAME_LOBBY", TAutomataBaseState.of(487317864L),
"/GAME_STARTING", TAutomataBaseState.of(1253633506L),
"/IN_GAME", TAutomataBaseState.of(1301012547L),
"/SCORE_SCREEN", TAutomataBaseState.of(1404098696L)
            );
        

            private final Map<String, TAutomataBaseActionType> actionsDictionary = Map.of(
                "/RESET", TAutomataBaseAction.of(1423436384L),
"/RUN", TAutomataBaseAction.of(1481692L),
"/TO_MENU", TAutomataBaseAction.of(99594860L),
"/EXIT", TAutomataBaseAction.of(45547981L),
"/MENU_HOVER", TAutomataBaseAction.of(1546956885L),
"/CREATE_GAME", TAutomataBaseAction.of(834502202L),
"/JOIN_GAME", TAutomataBaseAction.of(1675466392L),
"/START_GAME", TAutomataBaseAction.of(383736638L),
"/BEGIN_GAME", TAutomataBaseAction.of(1225901225L),
"/END_GAME", TAutomataBaseAction.of(808645083L)
            );
        
				private final Map<TAutomataBaseStateType, Map<TAutomataBaseActionType, AutomataStateTransitionResult>> stateTransitionMatrix = 
			Map.ofEntries(
				
				Map.entry(
					TAutomataBaseState.of(1696941163L),
					Map.of(
						
						TAutomataBaseAction.of(1423436384L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(45657535L),
								(payloadContext) -> {
									var pc = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					
					)
				)
			,

				Map.entry(
					TAutomataBaseState.of(45657535L),
					Map.of(
						
						TAutomataBaseAction.of(1481692L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(1415394173L),
								(payloadContext) -> {
									var pc = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					
					)
				)
			,

				Map.entry(
					TAutomataBaseState.of(1415394173L),
					Map.of(
						
						TAutomataBaseAction.of(99594860L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(1918712022L),
								(payloadContext) -> {
									var pc = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					
					)
				)
			,

				Map.entry(
					TAutomataBaseState.of(1918712022L),
					Map.of(
						
						TAutomataBaseAction.of(45547981L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(2004485394L),
								(payloadContext) -> {
									var pc = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					,

						TAutomataBaseAction.of(1546956885L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(1918712022L),
								(payloadContext) -> {
									var pc = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					,

						TAutomataBaseAction.of(834502202L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(487317864L),
								(payloadContext) -> {
									var pc = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					,
	
						TAutomataBaseAction.of(1675466392L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(487317864L),
								(payloadContext) -> {
									var pc = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					
					)
				)
			,

				Map.entry(
					TAutomataBaseState.of(487317864L),
					Map.of(
						
						TAutomataBaseAction.of(45547981L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(2004485394L),
								(payloadContext) -> {
									var pc = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					,

						TAutomataBaseAction.of(99594860L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(1918712022L),
								(payloadContext) -> {
									var pc = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					,

						TAutomataBaseAction.of(383736638L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(1253633506L),
								(payloadContext) -> {
									var pc = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					
					)
				)
			,

				Map.entry(
					TAutomataBaseState.of(1253633506L),
					Map.of(
						
						TAutomataBaseAction.of(1225901225L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(1301012547L),
								(payloadContext) -> {
									var pc = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					
					)
				)
			,

				Map.entry(
					TAutomataBaseState.of(1301012547L),
					Map.of(
						
						TAutomataBaseAction.of(45547981L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(2004485394L),
								(payloadContext) -> {
									var pc = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					,

						TAutomataBaseAction.of(808645083L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(1404098696L),
								(payloadContext) -> {
									var pc = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					,

						TAutomataBaseAction.of(99594860L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(1918712022L),
								(payloadContext) -> {
									var pc = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					
					)
				)
			,

				Map.entry(
					TAutomataBaseState.of(1404098696L),
					Map.of(
						
						TAutomataBaseAction.of(99594860L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(1918712022L),
								(payloadContext) -> {
									var pc = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					,

						TAutomataBaseAction.of(45547981L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(2004485394L),
								(payloadContext) -> {
									var pc = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					
					)
				)
			
			);
		
                
            public GeneratedAutomata() {
                super();
                TAutomataBaseStateType initialState = TAutomataBaseState.of(1696941163L);
                TAutomataContextType context = new TAutomataBaseContext();
                IAutomataReducer<TAutomataBaseStateType, TAutomataBaseActionType, TAutomataContextType, TAutomataPayloadType> rootReducer = 
            (event) -> {
                if(event.action == null || event.payload == null) {
                    return TAutomataStateContext.of(event.state, event.context);
                }
				
            // state validation
            if(!stateTransitionMatrix.containsKey(event.state)) {
                throw new RuntimeException("Invalid state, maybe machine isn't running");
            }
        
				
            // action validation
            if(!stateTransitionMatrix.get(event.state).containsKey(event.action)) {
                return TAutomataStateContext.of(
                        event.state,
                        event.context
                );
            }
        
                return handlersDict.get(initialState).reduce(event);
            }
        ;
                TAutomataParams<TAutomataBaseStateType, TAutomataBaseActionType, TAutomataBaseEventType,
                        TAutomataContextType, TAutomataPayloadType, TAutomataEventMetaType> params =
                        new TAutomataParams<>(
                                initialState,
                                context,
                                rootReducer,
                                this.getStateValidator(),
                                this.getActionValidator(),
                                this.getEventValidator()
                        );

                this.init(params);
            }
        
            }
        