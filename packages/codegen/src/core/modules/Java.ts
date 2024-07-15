import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { StartState, TDiagramAction } from '@yantrix/mermaid-parser';
import { Expressions, fillDictionaries } from '../shared.js';
import { ICodegen, TAssignTypeDict, TAssignTypes, TStateDiagramMatrixIncludeNotes } from '../../types/common.js';
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
			`package ${this.package}`,
			`import ${this.package}.types.*`,
			`import ${this.package}.types.automata.*`,
			`import ${this.package}.types.automata.AutomataTypes.*`,
			`import java.util.Map`,
			`import java.util.Objects`,
		];
		return lines.join(';\n');
	}

	getDictionaries(): string {
		return this.dictionaries.join('\n');
	}

	// ????
	// State transition matrix
	getActionToStateFromState(): string {
		throw new Error('Method not implemented.');
	}

	getDefaultContext(): string {
		throw new Error('Method not implemented.');
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
                // todo add handlers/transition matrix
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
                TAutomataContextType context = ${this.getInitialContext};
                IAutomataReducer<TAutomataBaseStateType, TAutomataBaseActionType, TAutomataContextType, TAutomataPayloadType> rootReducer = ${this.getRootReducer};
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
                ${Object.entries(this.stateDictionary)
					.map(([key, value]) => `${key}, TAutomataBaseState.of(${value}L)`)
					.join(',\n')}
            )
        `);

		// actions dictionary text representation
		this.dictionaries.push(`
            private final Map<String, TAutomataBaseActionType> actionsDictionary = Map.of(
                ${Object.entries(this.actionDictionary)
					.map(([key, value]) => `${key}, TAutomataBaseAction.of(${value}L)`)
					.join(',\n')}
            )
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
                else return handlersDict.get(initialState).reduce(event);
            }
        `;
		return `({ action, context, payload, state }) => {
					if (!action || payload === null) return { state, context };
					${this.getRootReducerStateValidation()}
					${this.getRootReducerActionValidation()}
					const {state:newState,getNewContext} = actionToStateFromStateDict[state][action]
					
							
					return {state:newState, context: getNewContext({payload,context})};
  				}`;
	}

	// Checks if state can be found in dictionary for the automata
	private getRootReducerStateValidation() {
		return `
            // state validation
            if(!statesDictionary.containsValue(event.state)) {
                throw new RuntimeException("Invalid state");
            }
        `;
	}

	// Checks if action can be found in dictionary for the automata & if the action is appropriate for the automata state
	// todo add action validation for transition matrix
	private getRootReducerActionValidation() {
		return `
            // action validation
            if(!actionsDictionary.containsValue(event.action)) {
                throw new RuntimeException("Invalid action");
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

	private getByExpressionValue<T extends TMappedKeys>({
		KeyItemDeclaration: { Expression },
	}: TKeyItemWithExpression<T>) {
		return Expressions[Expression.expressionType](Expression);
	}
}
