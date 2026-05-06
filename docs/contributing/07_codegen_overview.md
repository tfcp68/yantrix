---
title: Codegen Architecture Overview
---

# Codegen Architecture Overview

## Dialect Overview

| Dialect | Base class | Output | Architecture | Runtime deps | Instance type |
| ------- | ---------- | ------ | ------------ | ------------ | ------------- |
| JavaScript | `JavaScriptCodegen` | Single `.js` | Class, extends `GenericAutomata` | `@yantrix/core` | Class instance |
| TypeScript | `TypeScriptCodegen` | Single `.ts` | Class, extends `GenericAutomata` | `@yantrix/core` | Class instance |
| PureJavaScript | `PureJavaScriptCodegen` | Single `.js` | Functional factory, zero imports | Inline builtins | Plain object with getters |
| PureTypeScript | `PureTypeScriptCodegen` | `.js` + `.d.ts` | Functional factory + type declarations | Inline builtins | Typed plain object |
| Python | `PythonCodegen` (standalone) | Single `.py` | Functional factory, zero imports | `pydash` (runtime peer) | Dict with lambda accessors |

Inheritance: `JavaScriptCodegen` is the base for `TypeScriptCodegen` (adds `hasTypes: true`),
`PureJavaScriptCodegen` (adds inlined builtins, no imports), and `PureTypeScriptCodegen`
(adds `hasTypes: true` on top of PureJS). `PythonCodegen` is a standalone class with its
own expression system.

**`createEventBus` signature differs by dialect group:**

- Class-based (JS, TS): accepts constructors - `FSMs: Record<string, new () => GenericAutomata>`
- Factory-based (PureJS, PureTS): accepts factory functions - `FSMs: Record<string, () => TInstance>`

---

## Yantrix Code Generation Pipeline

```mermaid
sequenceDiagram
    title Yantrix Code Generation Pipeline
    autonumber

    actor U as User
    participant CLI as cli
    participant FS as FileSystem
    participant MD as mermaid diagram
    participant MP as mermaid-parser
    participant CG as CodegenCreator (generateAutomataFromStateDiagram)
    participant YP as YantrixParser
    participant IF as InjectFunctionsProcess
    participant JSGen as JavaScriptCodegen/TypeScriptCodegen/PureJavaScriptCodegen/PureTypeScriptCodegen/PythonCodegen
    participant GA as Generated Automata Class

    U ->> CLI: yantrix codegen --diagram-file ... --outLang ... --className ... --constants ... --functions-file ...
    CLI ->> MD: read diagramText
    CLI ->> MP: parseStateDiagram(diagramText)
    MP -->> CLI: structure (parsed stateDiagram)
    CLI ->> MP: createStateDiagram(structure)
    MP -->> CLI: matrix (TStateDiagramMatrix)

    CLI ->> CG: generateAutomataFromStateDiagram(matrix, options)
    CG ->> YP: new YantrixParser()
    note right of YP: creates parser instance that understands Yantrix notes syntax

    loop For each state in matrix.states
        CG ->> YP: parserInstance.parse(state.notesText)
        YP -->> CG: TNotes (defines, inject, emit, subscribe, byPass, expressions)
    end
    CG ->> CG: build statesIncludingNotes (states with TNotes or null)
    note right of CG: attaches parsed notes to each state, preserving states with no notes as null

    alt options.constants is provided
        CG ->> CG: constants = JSON.parse(options.constants)
        note right of CG: user-provided constants JSON becomes runtime CONSTANTS map
    else
        CG ->> CG: constants = null
        note right of CG: no constants passed expressions will not resolve
    end

    CG ->> IF: processFile(language)(options.functionFilePath)
    note right of IF: validates and normalizes path to user functions file (.ts/.js) for injection
    IF -->> CG: injectedFunctions { path }

    CG ->> JSGen: new JavaScriptCodegen({ diagramWithNotes, constants, injectedFunctions })
    note right of JSGen: constructs language-specific generator with full diagram context, constants and user functions metadata

    JSGen ->> JSGen: fillDictionaries(diagram, stateDictionary, actionDictionary, eventDictionary)
    note right of JSGen: adds all states, actions, and events from diagram/notes

    JSGen ->> JSGen: expressions.setupExpressions({ constants })
    note right of JSGen: configures TExpressionRecord: how to resolve constants, context, payload, functions into JS code

    JSGen ->> JSGen: buildDependencyGraph(diagram, imports)
    note right of JSGen: builds graph of defines/injects/functions and populates import list for user modules

    JSGen ->> JSGen: setupDictionaries({ diagram, dependencyGraph, expressionRecord, dictionaries })
    note right of JSGen: serializes actionsMap, statesMap, events, byPassedStates and other structures

    alt injectedFunctions.path != null
        JSGen ->> JSGen: importNamespaces = { [path]: [DEFAULT_USER_FUNCTIONS_NAMESPACE] }
        note right of JSGen: remembers namespace alias for user functions to import them as a module
    else
        note right of JSGen: no user functions supplied \b only built-in & internal functions will be registered
    end

    %% Code generation: imports, FunctionDictionary and functions
    CLI ->> JSGen: getCode({ outLang, className, constants?, functionFilePath? })
    note right of JSGen: main entry to emit final source: glues all fragments into a single automata file

    JSGen ->> JSGen: serializer.getImportsCode(props)
    note right of JSGen: generates top-level import statements (for automata core, dictionaries, event bus, etc.)

    JSGen ->> JSGen: serializer.importAll(props)
    note right of JSGen: emits imports for all dependencyGraph entries (user functions, external modules, injected namespaces)

    JSGen ->> JSGen: functions.serializer(props)
    note right of JSGen: builds FunctionDictionary instance declaration and basic registration boilerplate

    JSGen ->> JSGen: serializer.getFunctionDictionaryInternalRegisterCode()
    note right of JSGen: emits code that connects low-level internal helpers to the FunctionDictionary (e.g. wrappers used by reducers/predicates)

    JSGen ->> JSGen: serializer.getFunctionDictionaryBuiltInRegisterCode()
    note right of JSGen: emits code that registers all built-in Yantrix functions (math, logic, collection ops, etc.) into the FunctionDictionary

    JSGen ->> JSGen: serializer.getAutomataInternalsRegisterCode(props)
    note right of JSGen: emits code that exposes automata-specific internals (currentState, currentAction, cycle, epoch) as callable functions in FunctionDictionary

    JSGen ->> JSGen: serializer.getDictionariesCode(props)
    note right of JSGen: outputs code for state/action/event dictionaries and byPass sets used by the automata

    JSGen ->> JSGen: serializer.getDefaultContext(props)
    note right of JSGen: generates function getDefaultContext(prevContext, _payload) based on StartState context description

    %% Detailing the generation of reducers
    JSGen ->> JSGen: serializer.getStateReducerCode(props)
    note right of JSGen: compiles per-state context reducers into reducer[stateId]: (prevContext, payload, fd, automata) => newContext

    loop For each state in diagram.states
        JSGen ->> JSGen: getStateToContext(state)
        note right of JSGen: for a single logical state, prepare reducer body that returns new context
        JSGen ->> JSGen: stateValue = stateDictionary.getStateValues([state.id])[0]
        note right of JSGen: resolve numeric state id used in runtime reducer table

        JSGen ->> JSGen: ctx = getContextTransition({ value: stateValue, ... })
        note right of JSGen: compute context expression for this state (either prevContext or object literal)

		alt diagramState.notes.contextDescription is empty
			JSGen -->> JSGen: ctx = "prevContext"
		else
			loop For each ctx in diagramState.notes.contextDescription
				JSGen ->> JSGen: ctxRes.push(...getContextItem({ ctx, expressions })

				alt ctx has reducer
					JSGen ->> JSGen: arr = mapReducerItems(ctx.reducer, expressions)
					JSGen ->> JSGen: boundItems = getBoundValues(arr, ctx.context, expressions)
					note right of JSGen: boundItems → "key: IIFE(boundValue or fallbackExpression)"
				else
					note right of JSGen: items → "key: getDefaultPropertyContext(prevContext, key, maybeExpression)"
				end
			end
			JSGen -->> JSGen: ctx = "{ ...ctxRes }"
		end

        JSGen -->> JSGen: add "stateValue: (prevContext, _payload, _functionDictionary, _automata) => ctx" to reducer
        note right of JSGen: append the constructed reducer function for this state into the reducer object source
    end

    note over JSGen: As a result, const reducer = { [stateId]: fn(...) => newContext } is formed

    JSGen ->> JSGen: serializer.getPredicatesCode(props)
    note right of JSGen: generates predicate map (guards) used in transitions and in action-to-state resolution

    JSGen ->> JSGen: serializer.getActionToStateFromState(props)
    note right of JSGen: builds lookup table State x Action -> NextState (+predicate) for the generated automata

    JSGen ->> JSGen: serializer.getClassTemplate(props)
    note right of JSGen: emits the final automata class body (extends GenericAutomata, wires reducer, dictionaries, adapters)

    JSGen ->> JSGen: serializer.getAutomataEpochCounterCode()
    note right of JSGen: adds epoch/cycle counters that track automata lifecycle and are exposed via internals

    JSGen ->> JSGen: serializer.getAutomataInternalsRegisterCode(props)
    note right of JSGen: wires automata internals (state, action, epoch, cycle) into FunctionDictionary registration

    JSGen -->> CLI: generatedCode (string with automata class)
    note right of JSGen: returns final source string to CLI, ready to be written to the target file

    %% Writing a CLI File
    CLI ->> FS: writeFileSync(outputFilePath, generatedCode)
    FS -->> CLI: success

    CLI -->> U: "Automata generated and saved to outputFilePath"

```

_Figure 1: The code generation pipeline in Yantrix: the CLI reads a Mermaid state diagram and
Yantrix notes, parses them with mermaid-parser and YantrixParser, runs the codegen module to
build dictionaries, reducers and the automaton class, and finally writes the generated automaton
code to a file_
