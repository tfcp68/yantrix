---
title: Codegen
---

# Codegen diagrams

## Yantrix Runtime Event Flow

```mermaid
sequenceDiagram
	title Yantrix flow
	autonumber

	participant SRC as Source
	participant BUS as EventBus
	participant CL as CoreLoop
	participant DST as Destination

	participant FSM as Automata Instance
	participant RR as RootReducer
	participant EA as EventAdapter
	participant ED as EventDictionary

	participant SD as StateDictionary
	participant ADict as ActionDictionary
	participant FR as FunctionRegistry

%% Registration and initialization
	note over CL,FSM: Bootstrapping / codegen runtime wiring
	FSM ->> FR: register(builtInFunctions + userFunctions)
	ED ->> ED: GlobalEventDictionary.addEvents(...) (register automata events)
	CL ->> FSM: new AutomataInstance()
	CL ->> BUS: new BasicEventBus()
	FSM ->> EA: new AutomataEventAdapter()
	CL ->> EA: configure addEventListener/addEventEmitter(...)
	CL ->> BUS: subscribe(observedEvents from EventAdapter.handleEvent)
	CL ->> EA: bind to FSM.eventAdapter

%% Source publishes an external Event
	note over SRC,BUS: External input → Event
	SRC ->> BUS: dispatch(<TAutomataEventMetaType>)

%% EventBus handles the event stack
	loop While stack not empty and !paused
		BUS ->> BUS: _processEvents()
		BUS ->> BUS: shift() next <event, meta>
		BUS ->> CL: callback(eventObject)

	%% CoreLoop uses an adapter to turn Event → Actions
		note over CL,EA: Event → FSM Actions (handleEvent)
		CL ->> EA: handleEvent({event, meta})
		EA ->> EA: run all eventListeners[event]
		EA -->> CL: [ActionPayload...]

	%% For each Action: dispatch in FSM
		loop For each Action in Actions
			CL ->> FSM: dispatch({action, payload})
			note over FSM,RR: FSM delegates state change to generated rootReducer

			FSM ->> FSM: reduceQueue() (очередь, если была)
			FSM ->> RR: ({ state, context, action, payload })
			RR ->> RR: evaluate transitions and reducers
			RR ->> FSM: { state': S, context': C }

		%% Updating the state of the machine
			FSM ->> FSM: setContext({ state': S, context': C })

		%% EventAdapter: State → Events
			note over FSM,EA: Transition → Emitted Events
			FSM ->> EA: handleTransition(FSM.getContext())
			EA ->> EA: run all eventEmitters[state]
			EA -->> CL: [EmittedEvents...]

		%% CoreLoop publishes new Events back to EventBus
			CL ->> BUS: dispatch(...EmittedEvents)
		end
	end

	note over BUS,DST: Event → DataPacket → I/O
	BUS ->> DST: bind(bus) (создаётся подписка)
	BUS ->> DST: update(event, model?)
	DST ->> DST: send(dataPacket) via resolver
	DST ->> DST: requestEmitter() yields {data, result, error}
	note over DST,SRC: Внешние эффекты: HTTP, UI, FS, API...

%% UI/render as Destination
	BUS ->> DST: bus.subscribe(UI_* events)
	DST ->> SRC: update UI (React/DOM/Redux store, и т.п.)
```

_Figure 1: This diagram shows the runtime event flow in Yantrix: external events are dispatched to the EventBus, processed by the CoreLoop through the EventAdapter into actions, reduced by the generated automaton and its RootReducer, and finally emitted to destinations such as UI or external I/O_

## Yantrix Code Generation Pipeline

```mermaid
sequenceDiagram
    title Yantrix codegen flow
    autonumber

    actor U as User
    participant CLI as cli
    participant FS as FileSystem
    participant MD as mermaid diagram
    participant MP as mermaid-parser
    participant CG as CodegenCreator (generateAutomataFromStateDiagram)
    participant YP as YantrixParser
    participant IF as InjectFunctionsProcess
    participant JSGen as JavaScriptCodegen/TypeScriptCodegen
    participant GA as Generated Automata Class

    U ->> CLI: yantrix codegen --diagram-file ... --outLang ... --className ... --constants ... --functions-file ...
    CLI ->> MD: read diagramText
    CLI ->> MP: parseStateDiagram(diagramText)
    MP -->> CLI: structure (parsed stateDiagram)
    CLI ->> MP: createStateDiagram(structure)
    MP -->> CLI: matrix (TStateDiagramMatrix)

    CLI ->> CG: generateAutomataFromStateDiagram(matrix, options)
    CG ->> YP: new YantrixParser()

    loop For each state in matrix.states
        CG ->> YP: parserInstance.parse(state.notesText)
        YP -->> CG: TNotes (defines, inject, emit, subscribe, byPass, expressions)
    end
    CG ->> CG: build statesIncludingNotes (states with TNotes or null)

    alt options.constants is provided
        CG ->> CG: constants = JSON.parse(options.constants)
    else
        CG ->> CG: constants = null
    end

    CG ->> IF: processFile(language)(options.functionFilePath)
    IF -->> CG: injectedFunctions { path }

    CG ->> JSGen: new JavaScriptCodegen({ diagramWithNotes, constants, injectedFunctions })

    JSGen ->> JSGen: fillDictionaries(diagram, stateDictionary, actionDictionary, eventDictionary)
    note right of JSGen: добавляет все состояния, действия и события из диаграммы/notes

    JSGen ->> JSGen: expressions.setupExpressions({ constants })
    note right of JSGen: настраивает TExpressionRecord для всех видов выражений Yantrix (Context/Payload/Constant и др.)

    JSGen ->> JSGen: buildDependencyGraph(diagram, imports)
    note right of JSGen: строит dependencyGraph для defines/injects/функций, обновляет imports

    JSGen ->> JSGen: setupDictionaries({ diagram, dependencyGraph, expressionRecord, dictionaries })
    note right of JSGen: сериализует actionsMap, statesMap, events, byPassedStates и др. структуры

    alt injectedFunctions.path != null
        JSGen ->> JSGen: importNamespaces = { [path]: [DEFAULT_USER_FUNCTIONS_NAMESPACE] }
    end

    %% Code generation: imports, FunctionDictionary and functions
    CLI ->> JSGen: getCode({ outLang, className, constants?, functionFilePath? })

    JSGen ->> JSGen: serializer.getImportsCode(props)
    %% external imports by dependencyGraph
    JSGen ->> JSGen: serializer.importAll(props)

    JSGen ->> JSGen: functions.serializer(props)

    JSGen ->> JSGen: serializer.getFunctionDictionaryInternalRegisterCode()
    JSGen ->> JSGen: serializer.getFunctionDictionaryBuiltInRegisterCode()
    JSGen ->> JSGen: serializer.getAutomataInternalsRegisterCode(props)

    JSGen ->> JSGen: serializer.getDictionariesCode(props)
    note right of JSGen: генерирует код actionsMap, statesMap, events, serializedSetByPassed

    JSGen ->> JSGen: serializer.getDefaultContext(props)
    note right of JSGen: генерирует функцию getDefaultContext(prevContext, payload)

    %% Detailing the generation of reducers
    JSGen ->> JSGen: serializer.getStateReducerCode(props)

    loop For each state in diagram.states
        JSGen ->> JSGen: getStateToContext(state)
        JSGen ->> JSGen: stateValue = stateDictionary.getStateValues([state.id])[0]

        JSGen ->> JSGen: ctxExpr = getContextTransition({ value: stateValue, ... })

        alt diagramState.notes.contextDescription is empty
            JSGen -->> JSGen: ctxExpr = "prevContext"
        else
            loop For each ctx in diagramState.notes.contextDescription
                JSGen ->> JSGen: items = getContextItem({ ctx, expressions })

                alt ctx has reducer
                    JSGen ->> JSGen: arr = mapReducerItems(ctx.reducer, expressions)
                    JSGen ->> JSGen: boundItems = getBoundValues(arr, ctx.context, expressions)
                    note right of JSGen: boundItems → "key: IIFE(boundValue or fallbackExpression)"
                else
                    note right of JSGen: items → "key: getDefaultPropertyContext(prevContext, key, maybeExpression)"
                end
            end
            JSGen -->> JSGen: ctxExpr = "{ ...items }"
        end

        JSGen -->> JSGen: add "stateValue: (prevContext, payload, functionDictionary, automata) => ctxExpr" to reducer
    end

    note over JSGen: В результате сформирован const reducer = { [stateId]: fn(...) => newContext }

    JSGen ->> JSGen: serializer.getPredicatesCode(props)
    JSGen ->> JSGen: serializer.getActionToStateFromState(props)
    note right of JSGen: формирует таблицу переходов: State, Action

    %% Machine Class Generation
    JSGen ->> GA: serializer.getClassTemplate(props)

    JSGen ->> GA: serializer.getAutomataEpochCounterCode()
    JSGen ->> GA: serializer.getAutomataInternalsRegisterCode(props)

    JSGen -->> CLI: generatedCode (string with automata class)

    %% Writing a CLI File
    CLI ->> FS: writeFileSync(outputFilePath, generatedCode)
    FS -->> CLI: success

    CLI -->> U: "Automata generated and saved to outputFilePath"

```
_Figure 2: This diagram illustrates the code generation pipeline in Yantrix: the CLI reads a Mermaid state diagram and Yantrix notes, parses them with mermaid-parser and YantrixParser, runs the codegen module to build dictionaries, reducers and the automaton class, and finally writes the generated automaton code to a file_
