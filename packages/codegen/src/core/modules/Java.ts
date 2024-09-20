import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { StartState, TDiagramAction } from '@yantrix/mermaid-parser';

import { ICodegen, TGetCodeOptionsMap, TModuleParams, TStateDiagramMatrixIncludeNotes } from '../../types/common.js';
import { fillDictionaries } from '../shared.js';
import { ModuleNames } from './index';

export class JavaCodegen implements ICodegen<typeof ModuleNames.Java> {
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	diagram: TStateDiagramMatrixIncludeNotes;
	handlersDict: string[];
	initialContext: string;
	initialContextKeys: string[];
	changeStateHandlers: string[];
	dictionaries: string[];
	protected imports = {
		'@yantrix/automata': ['GenericAutomata'],
	};

	private package: string = 'org.example'; // base package name for all automata files

	constructor({ diagram }: TModuleParams) {
		this.actionDictionary = new BasicActionDictionary();
		this.stateDictionary = new BasicStateDictionary();
		this.diagram = diagram;

		this.handlersDict = [];
		this.changeStateHandlers = [];
		this.dictionaries = [];
		this.initialContextKeys = [];

		this.initialContext = this.getInitialContext();

		fillDictionaries(diagram, this.stateDictionary, this.actionDictionary);
		this.setupDictionaries();
	}

	public getCode(options: TGetCodeOptionsMap[typeof ModuleNames.Java]): string {
		return `
			${this.getImports()}
			${this.getClassTemplate(options.className)}
		`;
	}

	// Package declaration and imports necessary for the automata to function
	getImports(): string {
		const lines: string[] = [
			`package ${this.package};`,
			`import java.util.Map;`,
			`import java.util.Objects;`,
			`import java.util.HashMap;`,
			`import java.util.function.Function;`,
		];
		return lines.join('\n');
	}

	getDictionaries(): string {
		return this.dictionaries.join('\n');
	}

	public getActionToStateFromState(): string {
		return `public final Map<TAutomataBaseState, Map<TAutomataBaseAction, AutomataStateTransitionResult>> stateTransitionMatrix =
			Map.ofEntries(
				${this.getStateTransitionMatrix()}
			);
		`;
	}

	// State transition matrix
	getStateTransitionMatrix(): string {
		return Object
			.entries(this.diagram.transitions)
			.map(([state, transitions]) => {
				const value = this.stateDictionary.getStateValues({ keys: [state] })[0];
				if (!value)
					throw new Error(`State ${state} not found`);

				return `
				Map.entry(
					TAutomataBaseState.of(${value}L),
					Map.of(
						${this.getTransitions(transitions).join(',\n')}
					)
				)
			`;
			})
			.join(',\n');
	}

	getTransitions(transitions: Record<string, TDiagramAction>): string[] {
		return Object
			.entries(transitions)
			.map(([state, transition]) => {
				const newState = this.stateDictionary.getStateValues({ keys: [state] })[0];
				return transition.actionsPath.map(({ action }) => {
					const actionValue = this.actionDictionary.getActionValues({
						keys: action,
					})[0];
					if (!actionValue)
						throw new Error(`Action ${action} not found`);
					if (!newState)
						throw new Error(`State ${state} not found`);

					// const ctx = this.getSubsyntaxContext(key);

					return `
						TAutomataBaseAction.of(${actionValue}L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(${newState}L),
								(payloadContext) -> {
									var prevContext = getDefaultContext(payloadContext);
									return prevContext;
								}
						)
					`;
				});
			})
			.flatMap(el => `${el.join(',\n\t')}`);
	}

	getDefaultContext(): string {
		return `
            private TAutomataBaseContext getDefaultContext(AutomataPayloadContext arg) {
                TAutomataBaseContext prevContext = arg.context();
                return prevContext;
            }
        `;
	}

	// Full class declaration with all dictionaries and handlers inside
	getClassTemplate(className: string): string {
		return `
            public final class ${className} {
                ${this.getDictionaries()}
				${this.getActionToStateFromState()}
                ${this.setupClassMembers()}
                ${this.getDefaultConstructor(className)}
                ${this.setupClassMembersAccessors()}
				${this.getDefaultContext()}
                ${this.dispatchMethod()}
                ${this.toStringMethod()}
                ${this.getTypes()}
            }
        `;
	}

	// Default constructor for the class
	private getDefaultConstructor(className: string): string {
		return `
            public ${className}() {
                this.state = TAutomataBaseState.of(${this.getInitialState()}L);
                this.context = ${this.getInitialContext()};
                this.rootReducer = ${this.getRootReducer()};
            }
        `;
	}

	// Transforms codegen dictionaries into language-specific text representations
	private setupDictionaries(): void {
		// states dictionary text representation
		this.dictionaries.push(`
		public static final Map<String, TAutomataBaseState> statesDictionary = Map.of(
		${Object
				.entries(this.stateDictionary.getDictionary())
				.map(([key, value]) => `"${key}", TAutomataBaseState.of(${value}L)`)
				.join(',\n')}
		);
		`);

		// actions dictionary text representation
		this.dictionaries.push(`
		public static final Map<String, TAutomataBaseAction> actionsDictionary = Map.of(
		${Object
				.entries(this.actionDictionary.getDictionary())
				.map(([key, value]) => `"${key}", TAutomataBaseAction.of(${value}L)`)
				.join(',\n')}
		);
		`);
	}

	// Initial context is empty
	private getInitialContext(): string {
		return 'new TAutomataBaseContext()';
	}

	// Fetches first state from list
	private getInitialState(): number | null | undefined {
		return this.stateDictionary.getStateValues({ keys: [StartState] })[0];
	}

	// Root reducer function
	private getRootReducer(): string {
		return `
            (obj) -> {
                if(obj.action == null || obj.payload == null) {
                    return TAutomataStateContext.of(obj.state, obj.context);
                }
				${this.getRootReducerStateValidation()}
				${this.getRootReducerActionValidation()}
                AutomataStateTransitionResult res = stateTransitionMatrix.get(obj.state).get(obj.action);
				return TAutomataStateContext.of(
						res.newState(),
						res.getNewContext().apply(new AutomataPayloadContext(obj.payload, obj.context))
				);
            }
        `;
	}

	// Checks if state can be found in dictionary for the automata
	private getRootReducerStateValidation(): string {
		return `
            // state validation
            if(!stateTransitionMatrix.containsKey(obj.state)) {
                throw new RuntimeException("Invalid state, maybe machine isn't running");
            }
        `;
	}

	// Checks if action can be found in dictionary for the automata & if the action is appropriate for the automata state
	private getRootReducerActionValidation(): string {
		return `
            // action validation
            if(!stateTransitionMatrix.get(obj.state).containsKey(obj.action)) {
                return TAutomataStateContext.of(
                        obj.state,
                        obj.context
                );
            }
        `;
	}

	private setupClassMembers(): string {
		return `
            private TAutomataBaseState state;
            private TAutomataBaseContext context;
            private IAutomataReducer rootReducer;
        `;
	}

	private setupClassMembersAccessors(): string {
		return `
            public Map getStateTransitionMatrix() { return this.stateTransitionMatrix; }
            public TAutomataStateContext getContext() { return new TAutomataStateContext(this.state, this.context); }
            public IAutomataReducer getReducer() { return this.rootReducer; }

            public void setContext(TAutomataStateContext context) {
                this.state = context.state;
                this.context = context.context;
            }
        `;
	}

	private dispatchMethod(): string {
		return `
            public TAutomataStateContext dispatch(TAutomataActionPayload action) {
                TAutomataStateContext reducedValue =
                        this.rootReducer.apply(new TAutomataStateContextActionPayload(this.state, this.context, action.action, action.payload));
                this.setContext(reducedValue);
                return reducedValue;
            }
        `;
	}

	private toStringMethod(): string {
		return `
            @Override
            public String toString() {
                return "GeneratedAutomata{" +
                        "statesDictionary=" + statesDictionary +
                        ", actionsDictionary=" + actionsDictionary +
                        ", stateTransitionMatrix=" + stateTransitionMatrix +
                        '}';
            }
        `;
	}

	// Types necessary for the automata
	private getTypes(): string {
		return `
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
        `;
	}
}
