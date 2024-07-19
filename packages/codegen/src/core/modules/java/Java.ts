import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { StartState, TDiagramAction } from '@yantrix/mermaid-parser';
import { Expressions, fillDictionaries } from '../../shared.js';
import { ICodegen, TAssignTypeDict, TAssignTypes, TStateDiagramMatrixIncludeNotes } from '../../../types/common.js';
import {
	isKeyItemWithExpression,
	isPayloadContext,
	isPrevContext,
	isShortContext,
	TKeyItem,
	TKeyItemWithExpression,
	TMappedKeys,
} from '@yantrix/yantrix-parser';

export class JavaCodegen implements ICodegen {
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

	constructor(diagram: TStateDiagramMatrixIncludeNotes) {
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

	// Package declaration and imports necessary for the automata to function
	getImports(): string {
		const lines: string[] = [
			`package ${this.package};`,
			`import ${this.package}.types.*;`,
			`import ${this.package}.types.automata.*;`,
			`import ${this.package}.types.automata.AutomataTypes.*;`,
			`import java.util.Map;`,
			`import java.util.Objects;`,
		];
		return lines.join('\n');
	}

	getDictionaries(): string {
		return this.dictionaries.join('\n');
	}

	public getActionToStateFromState() {
		return `private final Map<TAutomataBaseStateType, Map<TAutomataBaseActionType, AutomataStateTransitionResult>> stateTransitionMatrix = 
			Map.ofEntries(
				${this.getStateTransitionMatrix()}
			);
		`;
	}

	// State transition matrix
	getStateTransitionMatrix(): string {
		return Object.keys(this.diagram.transitions)
			.map((state) => {
				const transitions = this.diagram.transitions[state];
				const value = this.stateDictionary.getStateValues({ keys: [state] })[0];
				if (!value) throw new Error(`State ${state} not found`);

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

	getTransitions(transitions: Record<string, TDiagramAction>) {
		return Object.keys(transitions)
			.map((key) => {
				const { actionsPath } = transitions[key];
				const newState = this.stateDictionary.getStateValues({ keys: [key] })[0];
				return actionsPath.map(({ action }) => {
					const actionValue = this.actionDictionary.getActionValues({
						keys: action,
					})[0];
					if (!actionValue) throw new Error(`Action ${action} not found`);
					if (!newState) throw new Error(`State ${key} not found`);

					const ctx = this.getSubsyntaxContext(key);

					return `
						TAutomataBaseAction.of(${actionValue}L),
						new AutomataStateTransitionResult(
								TAutomataBaseState.of(${newState}L),
								(payloadContext) -> {
									var pc = getDefaultContext(payloadContext);
									return ${ctx};
								}
						)
					`;
				});
			})
			.flatMap((el) => `${el.join(',\n\t')}`);
	}

	getDefaultContext(): string {
		// return `
		// 	private TAutomataBaseContext getDefaultContext(AutomataPayloadContext arg) {
		// 		TAutomataBaseContext prevContext = (TAutomataBaseContext) arg.context();
		// 		TAutomataBaseContext initialContext = ${this.getSubsyntaxContext(StartState)};
		// 		prevContext.forEach((key, value) -> initialContext.merge(key, value, (initValue, prevValue) -> prevValue));
		// 		return initialContext;
		// 	}
		// `;

		return `
			private TAutomataBaseContext getDefaultContext(AutomataPayloadContext arg) {
				return (TAutomataBaseContext) arg.context();
			}
		`;
	}

	private getSubsyntaxContext(state: string | null) {
		const value = this.diagram.states.find((diagramState) => {
			return diagramState.id === state;
		});

		if (!value) {
			throw new Error(`Invalid state - ${value}`);
		}

		if (!value.notes || !value.notes.contextDescription.length) {
			return `prevContext`;
		}
		const { contextDescription } = value.notes;

		const flattedContext = contextDescription.flatMap((e) => e.context.flatMap((e) => e));

		const unusedInitialKeys = this.initialContextKeys.filter(
			(key) => flattedContext.filter((e) => e.KeyItemDeclaration.TargetProperty === key).length === 0,
		);

		const normalizedUnusedKeys = unusedInitialKeys.map((property) => {
			return `${property}: ${TAssignTypeDict.PREV_CONTEXT}['${property}'],`;
		});

		// return `
		// 	new TAutomataBaseContext(Map.ofEntries(
		// 		Map.entry("integer", prevContext.getOrDefault("integer", 3)),
		// 		Map.entry("string", prevContext.getOrDefault("string", "str")),
		// 		Map.entry("array", prevContext.getOrDefault("array", new Object[]{}))
		// 	))
		// `

		return `
			new TAutomataBaseContext();
		`;
	}

	// Full class declaration with all dictionaries and handlers inside
	getClassTemplate(className: string): string {
		return `
            public final class ${className}
            extends GenericAutomata<
                TAutomataBaseStateType, TAutomataBaseActionType, TAutomataBaseEventType,
                TAutomataContextType, TAutomataPayloadType, TAutomataEventMetaType
            > {
                ${this.getDictionaries()}
				${this.getActionToStateFromState()}
                ${this.getDefaultConstructor(className)}
            }
        `;
	}

	// Default constructor for the class
	private getDefaultConstructor(className: string) {
		return `
            public ${className}() {
                super();
                TAutomataBaseStateType initialState = TAutomataBaseState.of(${this.getInitialState()}L);
                TAutomataContextType context = ${this.getInitialContext()};
                IAutomataReducer<TAutomataBaseStateType, TAutomataBaseActionType, TAutomataContextType, TAutomataPayloadType> rootReducer = ${this.getRootReducer()};
                TAutomataParams<TAutomataBaseStateType, TAutomataBaseActionType, TAutomataBaseEventType,
                        TAutomataContextType, TAutomataPayloadType, TAutomataEventMetaType> params =
                        new TAutomataParams<>(
                                initialState,
                                context,
                                rootReducer,
                                ${this.getStateValidator()},
                                ${this.getActionValidator()},
                                ${this.getEventValidator()}
                        );

                this.init(params);
            }
        `;
	}

	// Transforms codegen dictionaries into language-specific text representations
	private setupDictionaries() {
		// states dictionary text representation
		this.dictionaries.push(`
            private final Map<String, TAutomataBaseStateType> statesDictionary = Map.of(
                ${Object.entries(this.stateDictionary.getDictionary())
					.map(([key, value]) => `"${key}", TAutomataBaseState.of(${value}L)`)
					.join(',\n')}
            );
        `);

		// actions dictionary text representation
		this.dictionaries.push(`
            private final Map<String, TAutomataBaseActionType> actionsDictionary = Map.of(
                ${Object.entries(this.actionDictionary.getDictionary())
					.map(([key, value]) => `"${key}", TAutomataBaseAction.of(${value}L)`)
					.join(',\n')}
            );
        `);
	}

	// Initial context is empty
	private getInitialContext() {
		return 'new TAutomataBaseContext()';
	}

	// Fetches first state from list
	private getInitialState() {
		return this.stateDictionary.getStateValues({ keys: [StartState] })[0];
	}

	// Root reducer function
	private getRootReducer() {
		return `
            (event) -> {
                if(event.action == null || event.payload == null) {
                    return TAutomataStateContext.of(event.state, event.context);
                }
				${this.getRootReducerStateValidation()}
				${this.getRootReducerActionValidation()}
                return handlersDict.get(initialState).reduce(event);
            }
        `;
	}

	// Checks if state can be found in dictionary for the automata
	private getRootReducerStateValidation() {
		return `
            // state validation
            if(!stateTransitionMatrix.containsKey(event.state)) {
                throw new RuntimeException("Invalid state, maybe machine isn't running");
            }
        `;
	}

	// Checks if action can be found in dictionary for the automata & if the action is appropriate for the automata state
	// todo add action validation for transition matrix
	private getRootReducerActionValidation() {
		return `
            // action validation
            if(!stateTransitionMatrix.get(event.state).containsKey(event.action)) {
                return TAutomataStateContext.of(
                        event.state,
                        event.context
                );
            }
        `;
	}

	// State validator is taken from GenericAutomata , which inherits it from BasicValidatorContainer
	private getStateValidator() {
		return `this.getStateValidator()`;
	}

	// Action validator is taken from GenericAutomata , which inherits it from BasicValidatorContainer
	private getActionValidator() {
		return `this.getActionValidator()`;
	}

	// Event validator is taken from GenericAutomata , which inherits it from BasicValidatorContainer
	private getEventValidator() {
		return `this.getEventValidator()`;
	}
}
