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
			`import ${this.package}.misc.*;`,
			`import ${this.package}.exceptions.*;`,
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
		return `public final Map<TAutomataBaseStateType, Map<TAutomataBaseActionType, AutomataStateTransitionResult>> stateTransitionMatrix = 
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
									var prevContext = getDefaultContext(payloadContext);
									return ${ctx};
								}
						)
					`;
				});
			})
			.flatMap((el) => `${el.join(',\n\t')}`);
	}

	getDefaultContext(): string {
		return `
			private TAutomataBaseContext getDefaultContext(AutomataPayloadContext arg) {
				TAutomataBaseContext prevContext = (TAutomataBaseContext) arg.context();
				TAutomataBaseContext initialContext = ${this.getSubsyntaxContext(StartState)};
				prevContext.forEach((key, value) -> initialContext.merge(key, value, (initValue, prevValue) -> prevValue));
				return initialContext;
			}
		`;
	}

	// TODO
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

		// ???
		const normalizedUnusedKeys = unusedInitialKeys.map((property) => {
			return `${property}: ${TAssignTypeDict.PREV_CONTEXT}['${property}'],`;
		});

		const res = contextDescription
			.map((ctx) => {
				if (isPayloadContext(ctx)) {
					const { context, payload = [] } = ctx;
					return context.map((ctxItem, index) => {
						const boundProperty = payload[index] || null;
						return this.getContextValues(ctxItem, boundProperty, TAssignTypeDict.PAYLOAD);
					});
				} else if (isPrevContext(ctx)) {
					const { context, prevContext = [] } = ctx;
					return context.map((ctxItem, index) => {
						const boundProperty = prevContext[index] || null;
						return this.getContextValues(ctxItem, boundProperty, TAssignTypeDict.PREV_CONTEXT);
					});
				} else if (isShortContext(ctx)) {
					const { context } = ctx;
					return context.map((ctxItem) => {
						return this.getContextValues(ctxItem, null, TAssignTypeDict.PREV_CONTEXT);
					});
				}
				throw new Error(`Invalid context type - ${ctx}`);
			})
			.flatMap((template) => template.flatMap((el) => el))
			.join(',\n');

		return `
			new TAutomataBaseContext(Map.ofEntries(
				${res}
			))
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
				${this.getDefaultContext()}
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
            public static final Map<String, TAutomataBaseStateType> statesDictionary = Map.of(
                ${Object.entries(this.stateDictionary.getDictionary())
					.map(([key, value]) => `"${key}", TAutomataBaseState.of(${value}L)`)
					.join(',\n')}
            );
        `);

		// actions dictionary text representation
		this.dictionaries.push(`
            public static final Map<String, TAutomataBaseActionType> actionsDictionary = Map.of(
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
	private getRootReducerStateValidation() {
		return `
            // state validation
            if(!stateTransitionMatrix.containsKey(obj.state)) {
                throw new RuntimeException("Invalid state, maybe machine isn't running");
            }
        `;
	}

	// Checks if action can be found in dictionary for the automata & if the action is appropriate for the automata state
	private getRootReducerActionValidation() {
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

	private getContextValues(context: TKeyItem, boundProperty: TKeyItem | null, type: TAssignTypes) {
		const { TargetProperty: LeftTarget } = context.KeyItemDeclaration;

		if (boundProperty === null) {
			if (isKeyItemWithExpression(context)) {
				const value = this.getByExpressionValue(context);
				return `Map.entry("${LeftTarget}", ${TAssignTypeDict.PREV_CONTEXT}.getOrDefault("${LeftTarget}", ${value}))`;
			}
			return `Map.entry("${LeftTarget}", ${TAssignTypeDict.PREV_CONTEXT}.get("${LeftTarget}"))`;
		}

		const { TargetProperty: RightTarget } = boundProperty.KeyItemDeclaration;
		const isEmptyInitial = !isKeyItemWithExpression(context);

		const isEmptyBoundExpression = !isKeyItemWithExpression(boundProperty);

		if (isEmptyBoundExpression && isEmptyInitial) {
			return `Map.entry("${LeftTarget}", ${type}.get("${RightTarget}"))`;
		}

		//	#{ selectedIndex = 3 } <= (index ) || { selectedIndex }
		if (isEmptyBoundExpression && !isEmptyInitial) {
			if (isKeyItemWithExpression(context)) {
				const value = this.getByExpressionValue(context);

				return `Map.entry("${LeftTarget}", ${type}.getOrDefault("${RightTarget}", ${value}))`;
			}
		}
		//	#{ selectedIndex } <= (index=3)
		if (!isEmptyBoundExpression && isEmptyInitial) {
			if (isKeyItemWithExpression(boundProperty)) {
				const value = this.getByExpressionValue(boundProperty);

				return `Map.entry("${LeftTarget}", ${type}.getOrDefault("${RightTarget}", ${value}))`;
			}
		}
		if (isKeyItemWithExpression(boundProperty) && isKeyItemWithExpression(context)) {
			const leftValue = this.getByExpressionValue(context);
			const rightValue = this.getByExpressionValue(boundProperty);

			return `Map.entry("${LeftTarget}", ${type}.getOrDefault("${RightTarget}", (${rightValue} != null ? ${rightValue} : ${leftValue})))`;
		}
		return `Map.entry("${LeftTarget}", null)`;
	}

	private getByExpressionValue<T extends TMappedKeys>({
		KeyItemDeclaration: { Expression },
	}: TKeyItemWithExpression<T>) {
		return Expressions[Expression.expressionType](Expression);
	}
}
