package org.example;
import java.util.Map;
import java.util.Objects;
import java.util.HashMap;
import java.util.function.Function;

            public final class GeneratedAutomata {
                
            public static final Map<String, TAutomataBaseState> statesDictionary = Map.of(
                "~~~START~~~", TAutomataBaseState.of(74979334L),
"INIT", TAutomataBaseState.of(2252048L),
"INTRO", TAutomataBaseState.of(69824076L),
"MAIN_MENU", TAutomataBaseState.of(1730055131L),
"~~~END~~~", TAutomataBaseState.of(1644281759L),
"GAME_LOBBY", TAutomataBaseState.of(1929949911L),
"GAME_STARTING", TAutomataBaseState.of(1032785389L),
"IN_GAME", TAutomataBaseState.of(1608719668L),
"SCORE_SCREEN", TAutomataBaseState.of(1985829159L)
            );
        

            public static final Map<String, TAutomataBaseAction> actionsDictionary = Map.of(
                "RESET", TAutomataBaseAction.of(77866287L),
"RUN", TAutomataBaseAction.of(81515L),
"TO_MENU", TAutomataBaseAction.of(407301981L),
"EXIT", TAutomataBaseAction.of(2142494L),
"MENU_HOVER", TAutomataBaseAction.of(1305378364L),
"CREATE_GAME", TAutomataBaseAction.of(1688544597L),
"JOIN_GAME", TAutomataBaseAction.of(1973300761L),
"START_GAME", TAutomataBaseAction.of(1058895409L),
"BEGIN_GAME", TAutomataBaseAction.of(1626434024L),
"END_GAME", TAutomataBaseAction.of(1757631242L)
            );
        
				public final Map<TAutomataBaseState, Map<TAutomataBaseAction, AutomataStateTransitionResult>> stateTransitionMatrix =
			Map.ofEntries(
				
				Map.entry(
					TAutomataBaseState.of(74979334L),
					Map.of(
						
						TAutomataBaseAction.of(77866287L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(2252048L),
								(payloadContext) -> {
									var prevContext = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					
					)
				)
			,

				Map.entry(
					TAutomataBaseState.of(2252048L),
					Map.of(
						
						TAutomataBaseAction.of(81515L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(69824076L),
								(payloadContext) -> {
									var prevContext = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					
					)
				)
			,

				Map.entry(
					TAutomataBaseState.of(69824076L),
					Map.of(
						
						TAutomataBaseAction.of(407301981L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(1730055131L),
								(payloadContext) -> {
									var prevContext = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					
					)
				)
			,

				Map.entry(
					TAutomataBaseState.of(1730055131L),
					Map.of(
						
						TAutomataBaseAction.of(2142494L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(1644281759L),
								(payloadContext) -> {
									var prevContext = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					,

						TAutomataBaseAction.of(1305378364L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(1730055131L),
								(payloadContext) -> {
									var prevContext = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					,

						TAutomataBaseAction.of(1688544597L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(1929949911L),
								(payloadContext) -> {
									var prevContext = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					,
	
						TAutomataBaseAction.of(1973300761L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(1929949911L),
								(payloadContext) -> {
									var prevContext = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					
					)
				)
			,

				Map.entry(
					TAutomataBaseState.of(1929949911L),
					Map.of(
						
						TAutomataBaseAction.of(2142494L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(1644281759L),
								(payloadContext) -> {
									var prevContext = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					,

						TAutomataBaseAction.of(407301981L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(1730055131L),
								(payloadContext) -> {
									var prevContext = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					,

						TAutomataBaseAction.of(1058895409L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(1032785389L),
								(payloadContext) -> {
									var prevContext = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					
					)
				)
			,

				Map.entry(
					TAutomataBaseState.of(1032785389L),
					Map.of(
						
						TAutomataBaseAction.of(1626434024L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(1608719668L),
								(payloadContext) -> {
									var prevContext = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					
					)
				)
			,

				Map.entry(
					TAutomataBaseState.of(1608719668L),
					Map.of(
						
						TAutomataBaseAction.of(2142494L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(1644281759L),
								(payloadContext) -> {
									var prevContext = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					,

						TAutomataBaseAction.of(1757631242L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(1985829159L),
								(payloadContext) -> {
									var prevContext = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					,

						TAutomataBaseAction.of(407301981L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(1730055131L),
								(payloadContext) -> {
									var prevContext = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					
					)
				)
			,

				Map.entry(
					TAutomataBaseState.of(1985829159L),
					Map.of(
						
						TAutomataBaseAction.of(407301981L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(1730055131L),
								(payloadContext) -> {
									var prevContext = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					,

						TAutomataBaseAction.of(2142494L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(1644281759L),
								(payloadContext) -> {
									var prevContext = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					
					)
				)
			
			);
		
                
            private TAutomataBaseState state;
            private TAutomataBaseContext context;
            private IAutomataReducer rootReducer;
        
                
            public GeneratedAutomata() {
                this.state = TAutomataBaseState.of(74979334L);
                this.context = new TAutomataBaseContext();
                this.rootReducer = 
            (obj) -> {
                if(obj.action == null || obj.payload == null) {
                    return TAutomataStateContext.of(obj.state, obj.context);
                }
				
            // state validation
            if(!stateTransitionMatrix.containsKey(obj.state)) {
                throw new RuntimeException("Invalid state, maybe machine isn't running");
            }
        
				
            // action validation
            if(!stateTransitionMatrix.get(obj.state).containsKey(obj.action)) {
                return TAutomataStateContext.of(
                        obj.state,
                        obj.context
                );
            }
        
                AutomataStateTransitionResult res = stateTransitionMatrix.get(obj.state).get(obj.action);
				return TAutomataStateContext.of(
						res.newState(),
						res.getNewContext().apply(new AutomataPayloadContext(obj.payload, obj.context))
				);
            }
        ;
            }
        
                
            public Map getStateTransitionMatrix() { return this.stateTransitionMatrix; }
            public TAutomataStateContext getContext() { return new TAutomataStateContext(this.state, this.context); }
            public IAutomataReducer getReducer() { return this.rootReducer; }

            public void setContext(TAutomataStateContext context) {
                this.state = context.state;
                this.context = context.context;
            }
        
				
            private TAutomataBaseContext getDefaultContext(AutomataPayloadContext arg) {
                TAutomataBaseContext prevContext = arg.context();
                return prevContext;
            }
        
                
            public TAutomataStateContext dispatch(TAutomataActionPayload action) {
                TAutomataStateContext reducedValue =
                        this.rootReducer.apply(new TAutomataStateContextActionPayload(this.state, this.context, action.action, action.payload));
                this.setContext(reducedValue);
                return reducedValue;
            }
        
                
            @Override
            public String toString() {
                return "GeneratedAutomata{" +
                        "statesDictionary=" + statesDictionary +
                        ", actionsDictionary=" + actionsDictionary +
                        ", stateTransitionMatrix=" + stateTransitionMatrix +
                        '}';
            }
        
                
            public abstract static class TAutomataBaseType {
                protected Long value;
                public Long getValue() { return value; }

                @Override
                public boolean equals(Object o) {
                    if (this == o) return true;
                    if (o == null || getClass() != o.getClass()) return false;
                    TAutomataBaseType that = (TAutomataBaseType) o;
                    return Objects.equals(value, that.value);
                }

                @Override
                public int hashCode() {
                    return Objects.hash(value);
                }
            }

            public static class TAutomataBaseState extends TAutomataBaseType {

                private TAutomataBaseState() {}
                private TAutomataBaseState(Long value) { this.value = value; }

                public static TAutomataBaseState of(Long value) { return new TAutomataBaseState(value); }

            }

            public static class TAutomataBaseAction extends TAutomataBaseType {

                private TAutomataBaseAction() {}
                private TAutomataBaseAction(Long value) { this.value = value; }

                public static TAutomataBaseAction of(Long value) { return new TAutomataBaseAction(value); }

            }

            public static class TAutomataBaseContext extends HashMap<String, Object> {
                public TAutomataBaseContext(Map<String, Object> map) { super(map); }

                private TAutomataBaseContext(TAutomataBasePayload payload) {
                    super();
                    this.putAll(payload);
                }

                public static TAutomataBaseContext fromPayload(TAutomataBasePayload payload) {
                    return new TAutomataBaseContext(payload);
                }
            }

            public static class TAutomataBasePayload extends HashMap<String, Object> {
            }

            public record AutomataStateTransitionResult (
                    TAutomataBaseState newState,
                    Function<AutomataPayloadContext, TAutomataBaseContext> getNewContext
            ) {
            }

            public interface IAutomataReducer extends Function<TAutomataStateContextActionPayload, TAutomataStateContext> {}

            public record TAutomataStateContext(TAutomataBaseState state, TAutomataBaseContext context) {}
            public record TAutomataStateContextActionPayload(TAutomataBaseState state, TAutomataBaseContext context, TAutomataBaseAction action, TAutomataBasePayload payload) {}
            public record AutomataPayloadContext(TAutomataBasePayload payload,TAutomataBaseContext context) {}
            public record TAutomataActionPayload(TAutomataBaseAction action, TAutomataBasePayload payload) {}
        
            }
        