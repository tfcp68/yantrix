# Eta Templates Hierarchy — Codegen

## The `it` object (built in `buildTemplateModel()`)

```
it = {
  className,
  imports,                          // TImports — { [pkg]: string[] }
  importNamespaces,                 // TNullable<TImports>
  diagram,                          // TStateDiagramMatrixIncludeNotes
  stateDictionary,                  // BasicStateDictionary
  actionDictionary,                 // BasicActionDictionary
  eventDictionary,                  // BasicEventDictionary
  expressions,                      // TExpressionRecord
  defines,                          // DefineStatement[]
  injects,                          // InjectStatement[]
  injectedPath,                     // TNullable<string>
  functions: {
    userFunctionsCheck,             // { injectIdentifiers: string[] }
    customRegistrations,            // TCustomRegistration[]
    userFunctionsNamespace,         // string | null
  },
  initialStateId,                   // string
  initialStateValue,                // number
  initialContext,                   // Record<string, unknown>
  startStateKey,                    // StartState
  byPassAction,                     // ByPassAction
  context: {
    reducer,                        // { entries: { stateValue, transition }[] }
    defaultContext,                  // { startStateValue, transition }
  },
  forks: {
    predicates,                     // Record<stateId, Record<actionId, { transitions }>>
  },
  events: {
    eventAdapter,                   // { emitters, listeners }
    createEventBus,                 // { resultVarName }
  },
  dictionaries: {
    actionToStateFromState,         // Record<stateId, Record<actionId, { state, withPredicate }>>
    byPassedList,                   // number[]
    actionsMap,                     // Record<string, number>
    statesMap,                      // Record<string, number>
  },
}
```

## Full template hierarchy diagram

```mermaid
flowchart TB
  classDef entryJs fill:#2d6a4f,color:#fff,stroke:#1b4332
  classDef entryTs fill:#1d3557,color:#fff,stroke:#0d1b2a
  classDef shared fill:#7209b7,color:#fff,stroke:#3a0ca3
  classDef sharedLeaf fill:#b5179e,color:#fff,stroke:#7209b7
  classDef jsOnly fill:#588157,color:#fff,stroke:#344e41
  classDef jsLeaf fill:#a3b18a,color:#000,stroke:#588157
  classDef tsOnly fill:#457b9d,color:#fff,stroke:#1d3557
  classDef tsLeaf fill:#a8dadc,color:#000,stroke:#457b9d

  %% ════════════════════════════════════════════════════
  %% ENTRY POINTS
  %% ════════════════════════════════════════════════════
  JS_MOD["<b>js/module.eta</b><br/><i>Entry point JS</i>"]:::entryJs
  TS_MOD["<b>ts/module.eta</b><br/><i>Entry point TS</i>"]:::entryTs

  %% ════════════════════════════════════════════════════
  %% SHARED — IMPORTS
  %% ════════════════════════════════════════════════════
  subgraph SHARED_IMPORTS ["shared/imports/"]
    direction TB
    SH_IMP_MOD["imports/module"]:::shared
    SH_IMP_NAMED["imports/named/module<br/><i>it.imports</i>"]:::sharedLeaf
    SH_IMP_NS["imports/namespace/module<br/><i>it.importNamespaces</i>"]:::sharedLeaf
  end
  SH_IMP_MOD -->|it| SH_IMP_NAMED
  SH_IMP_MOD -->|it| SH_IMP_NS

  %% ════════════════════════════════════════════════════
  %% SHARED — FORKS
  %% ════════════════════════════════════════════════════
  subgraph SHARED_FORKS ["shared/forks/"]
    direction TB
    SH_FORK_MOD["forks/module"]:::shared
    SH_FORK_PRED_MOD["forks/predicates/module"]:::shared
    SH_FORK_PREDICATES["forks/predicates/predicates<br/><i>predicates</i>"]:::shared
    SH_FORK_STATE_PRED["forks/predicates/statePredicateEntry<br/><i>stateId, actionPredicates</i>"]:::sharedLeaf
    SH_FORK_ACT_PRED["forks/predicates/actionPredicateEntry<br/><i>actionId, predicate</i>"]:::sharedLeaf
    SH_FORK_TRANS_PRED["forks/predicates/transitionPredicateEntry<br/><i>transition, transitionIndex</i>"]:::sharedLeaf
  end
  SH_FORK_MOD -->|"{ predicates: it.forks.predicates }"| SH_FORK_PRED_MOD
  SH_FORK_PRED_MOD -->|it| SH_FORK_PREDICATES
  SH_FORK_PREDICATES -->|"{ stateId, actionPredicates }"| SH_FORK_STATE_PRED
  SH_FORK_STATE_PRED -->|"{ actionId, predicate }"| SH_FORK_ACT_PRED
  SH_FORK_ACT_PRED -->|"{ transition, transitionIndex }"| SH_FORK_TRANS_PRED

  %% ════════════════════════════════════════════════════
  %% SHARED — DICTIONARIES
  %% ════════════════════════════════════════════════════
  subgraph SHARED_DICTS ["shared/dictionaries/"]
    direction TB
    SH_DICT_MOD["dictionaries/module"]:::shared

    subgraph DECL ["declarations/"]
      direction TB
      SH_DICT_DECL_MOD["declarations/module"]:::shared
      SH_DICT_STATES["statesDictionary<br/><i>it.stateDictionary</i>"]:::sharedLeaf
      SH_DICT_ACTIONS["actionsDictionary<br/><i>it.actionDictionary</i>"]:::sharedLeaf
      SH_DICT_EVENTS["eventDictionary<br/><i>it.eventDictionary</i>"]:::sharedLeaf
      SH_DICT_FUNCS["functionDictionary"]:::sharedLeaf
    end

    subgraph MAPS ["maps/"]
      direction TB
      SH_DICT_MAPS_MOD["maps/module"]:::shared
      SH_DICT_ACTIONS_MAP["actionsMap<br/><i>it.dictionaries.actionsMap</i>"]:::sharedLeaf
      SH_DICT_STATES_MAP["statesMap<br/><i>it.dictionaries.statesMap</i>"]:::sharedLeaf
    end

    subgraph TRANS ["transitions/"]
      direction TB
      SH_DICT_TRANS_MOD["transitions/module"]:::shared
      SH_DICT_A2S_FROM["actionToStateFromStateDict<br/><i>it.dictionaries.actionToStateFromState</i>"]:::shared
      SH_DICT_A2S_STATE["actionToStateStateEntry<br/><i>stateId, actions</i>"]:::sharedLeaf
      SH_DICT_A2S_ENTRY["actionToStateEntry<br/><i>stateId, actionId, entry</i>"]:::sharedLeaf
    end

    subgraph RUNTIME ["runtime/"]
      direction TB
      SH_DICT_RT_MOD["runtime/module"]:::shared
      SH_DICT_BYPASS["byPassedStates<br/><i>it.dictionaries.byPassedList</i>"]:::sharedLeaf
      SH_DICT_REGISTRIES["runtimeRegistries<br/><i>it.className</i>"]:::sharedLeaf
    end
  end
  SH_DICT_MOD -->|it| SH_DICT_DECL_MOD
  SH_DICT_MOD -->|it| SH_DICT_MAPS_MOD
  SH_DICT_MOD -->|it| SH_DICT_TRANS_MOD
  SH_DICT_MOD -->|it| SH_DICT_RT_MOD

  SH_DICT_DECL_MOD -->|it| SH_DICT_STATES
  SH_DICT_DECL_MOD -->|it| SH_DICT_ACTIONS
  SH_DICT_DECL_MOD -->|it| SH_DICT_EVENTS
  SH_DICT_DECL_MOD -->|it| SH_DICT_FUNCS

  SH_DICT_MAPS_MOD -->|it| SH_DICT_ACTIONS_MAP
  SH_DICT_MAPS_MOD -->|it| SH_DICT_STATES_MAP

  SH_DICT_TRANS_MOD -->|it| SH_DICT_A2S_FROM
  SH_DICT_A2S_FROM -->|"{ stateId, actions }"| SH_DICT_A2S_STATE
  SH_DICT_A2S_STATE -->|"{ stateId, actionId, entry }"| SH_DICT_A2S_ENTRY

  SH_DICT_RT_MOD -->|it| SH_DICT_BYPASS

  %% ════════════════════════════════════════════════════
  %% SHARED — FUNCTIONS
  %% ════════════════════════════════════════════════════
  subgraph SHARED_FUNCS ["shared/functions/"]
    direction TB
    SH_FUNC_MOD["functions/module<br/><i>extracts: registrations = it.functions.customRegistrations</i>"]:::shared

    subgraph USER ["user/"]
      direction TB
      SH_FUNC_USER_MOD["user/module<br/><i>it + registrations</i>"]:::shared
      SH_FUNC_RESOLVE["resolveUserFunctions<br/><i>namespace: it.functions.userFunctionsNamespace</i>"]:::sharedLeaf
      SH_FUNC_VALIDATE["validateInjectedFunctions<br/><i>injectIdentifiers: it.functions.userFunctionsCheck.injectIdentifiers</i>"]:::sharedLeaf
    end

    subgraph REG ["registrations/"]
      direction TB
      SH_FUNC_REG_MOD["registrations/module<br/><i>it + registrations</i>"]:::shared
      SH_FUNC_REG_DEFINE["registerDefine<br/><i>registration</i>"]:::sharedLeaf
      SH_FUNC_REG_INJECT["registerInject<br/><i>registration</i>"]:::sharedLeaf
    end
  end
  SH_FUNC_MOD -->|"{ ...it, registrations }"| SH_FUNC_USER_MOD
  SH_FUNC_MOD -->|"{ ...it, registrations }"| SH_FUNC_REG_MOD
  SH_FUNC_USER_MOD -->|"{ namespace }"| SH_FUNC_RESOLVE
  SH_FUNC_USER_MOD -->|"{ injectIdentifiers }"| SH_FUNC_VALIDATE
  SH_FUNC_REG_MOD -->|"{ registration }"| SH_FUNC_REG_DEFINE
  SH_FUNC_REG_MOD -->|"{ registration }"| SH_FUNC_REG_INJECT

  %% ════════════════════════════════════════════════════
  %% SHARED — EVENTS
  %% ════════════════════════════════════════════════════
  subgraph SHARED_EVENTS ["shared/events/"]
    direction TB
    SH_EVT_MOD["events/module"]:::shared

    subgraph ADAPTER ["adapter/"]
      direction TB
      SH_EVT_ADAPT_MOD["adapter/module"]:::shared
      SH_EVT_ADAPTER["eventAdapter<br/><i>it</i>"]:::shared
      SH_EVT_EMITTERS["emitters<br/><i>emitters: it.events.eventAdapter.emitters</i>"]:::shared
      SH_EVT_EMITTER_ENTRY["emitterEntry<br/><i>emitter</i>"]:::sharedLeaf
      SH_EVT_CODE_ENTRY["eventCodeEntry<br/><i>eventCode</i>"]:::sharedLeaf
      SH_EVT_LISTENERS["listeners<br/><i>listeners: it.events.eventAdapter.listeners</i>"]:::shared
      SH_EVT_LISTENER_ENTRY["listenerEntry<br/><i>listener</i>"]:::sharedLeaf
      SH_EVT_PL_ENTRIES["payloadEntries<br/><i>entries</i>"]:::shared
      SH_EVT_PL_ENTRY["payloadEntry<br/><i>entry</i>"]:::sharedLeaf
      SH_EVT_SRC_VAL["sourceValue<br/><i>source</i>"]:::sharedLeaf
    end

    subgraph BUS ["bus/"]
      direction TB
      SH_EVT_BUS_MOD["bus/module"]:::shared
      SH_EVT_BUS_CREATE["createEventBus<br/><i>it</i>"]:::shared
      SH_EVT_BUS_FACTORY["createEventBusAutomatasFactory<br/><i>it</i>"]:::sharedLeaf
      SH_EVT_BUS_SUBS["createEventBusSubscriptions<br/><i>it.events.createEventBus</i>"]:::sharedLeaf
    end
  end
  SH_EVT_MOD -->|it| SH_EVT_ADAPT_MOD
  SH_EVT_MOD -->|it| SH_EVT_BUS_MOD

  SH_EVT_ADAPT_MOD -->|it| SH_EVT_ADAPTER
  SH_EVT_ADAPTER -->|"{ emitters }"| SH_EVT_EMITTERS
  SH_EVT_ADAPTER -->|"{ listeners }"| SH_EVT_LISTENERS
  SH_EVT_EMITTERS -->|"{ emitter }"| SH_EVT_EMITTER_ENTRY
  SH_EVT_EMITTER_ENTRY -->|"{ eventCode }"| SH_EVT_CODE_ENTRY
  SH_EVT_CODE_ENTRY -->|"{ entries }"| SH_EVT_PL_ENTRIES
  SH_EVT_LISTENERS -->|"{ listener }"| SH_EVT_LISTENER_ENTRY
  SH_EVT_LISTENER_ENTRY -->|"{ entries }"| SH_EVT_PL_ENTRIES
  SH_EVT_PL_ENTRIES -->|"{ entry }"| SH_EVT_PL_ENTRY
  SH_EVT_PL_ENTRY -->|"{ source }"| SH_EVT_SRC_VAL

  SH_EVT_BUS_MOD -->|it| SH_EVT_BUS_CREATE
  SH_EVT_BUS_CREATE -->|it| SH_EVT_BUS_FACTORY
  SH_EVT_BUS_CREATE -->|it| SH_EVT_BUS_SUBS

  %% ════════════════════════════════════════════════════
  %% SHARED — EXPRESSIONS
  %% ════════════════════════════════════════════════════
  subgraph SHARED_EXPR ["shared/expressions/"]
    direction TB
    SH_EXPR_MOD["expressions/module<br/><i>{ model }</i>"]:::shared
    SH_EXPR_CALLS_MOD["expressions/calls/module<br/><i>{ model }</i>"]:::shared
    SH_EXPR_FUNC_CALL["calls/functionCall<br/><i>model (name, args)</i>"]:::sharedLeaf
    SH_EXPR_INT_CALL["calls/internalFunctionCall<br/><i>model (name)</i>"]:::sharedLeaf
    SH_EXPR_DEF_PROP["context/defaultPropertyContext<br/><i>path, identifier, expression</i>"]:::sharedLeaf
  end
  SH_EXPR_MOD -->|"{ model }"| SH_EXPR_CALLS_MOD
  SH_EXPR_CALLS_MOD -->|it| SH_EXPR_FUNC_CALL
  SH_EXPR_CALLS_MOD -->|it| SH_EXPR_INT_CALL
  SH_EXPR_FUNC_CALL -.->|"recursive: each arg"| SH_EXPR_MOD

  %% ════════════════════════════════════════════════════
  %% SHARED — CONTEXT / REDUCERS
  %% ════════════════════════════════════════════════════
  subgraph SHARED_CTX ["shared/context/reducers/"]
    direction TB
    SH_CTX_TRANS["contextTransition<br/><i>transition</i>"]:::shared
    SH_CTX_ITEM_NO["contextItemNoReducer<br/><i>identifier, defaultExpressionValueRight</i>"]:::sharedLeaf
    SH_CTX_ITEM_WITH["contextItemWithReducer<br/><i>boundValues</i>"]:::shared
    SH_CTX_BV["boundValues<br/><i>boundValues[]</i>"]:::shared
    SH_CTX_BV_ITEM["boundValuesItem<br/><i>boundValue (source, target, default)</i>"]:::sharedLeaf
    SH_CTX_CONST["mapReducerItemsConstant<br/><i>expressionValueRight</i>"]:::sharedLeaf
    SH_CTX_EXPR["mapReducerItemsExpression<br/><i>expressionValueRight</i>"]:::sharedLeaf
  end
  SH_CTX_TRANS -->|"{ identifier, defaultExpressionValueRight }"| SH_CTX_ITEM_NO
  SH_CTX_TRANS -->|"{ boundValues }"| SH_CTX_ITEM_WITH
  SH_CTX_ITEM_WITH -->|"{ boundValues }"| SH_CTX_BV
  SH_CTX_BV -->|"{ boundValue }"| SH_CTX_BV_ITEM
  SH_CTX_BV_ITEM -->|"{ path, identifier, expression }"| SH_EXPR_DEF_PROP
  SH_CTX_BV_ITEM -->|"{ expressionValueRight }"| SH_CTX_CONST
  SH_CTX_BV_ITEM -->|"{ expressionValueRight }"| SH_CTX_EXPR
  SH_CTX_ITEM_NO -->|"{ path, identifier, expression }"| SH_EXPR_DEF_PROP

  %% cross-ref: sourceValue -> defaultPropertyContext
  SH_EVT_SRC_VAL -->|"{ path, identifier, expression }"| SH_EXPR_DEF_PROP

  %% cross-ref: registerDefine -> expressions/module
  SH_FUNC_REG_DEFINE -->|"{ model: registration.bodyModel }"| SH_EXPR_MOD

  %% ════════════════════════════════════════════════════
  %% JS-ONLY — CONTEXT
  %% ════════════════════════════════════════════════════
  subgraph JS_CTX ["js/context/"]
    direction TB
    JS_CTX_MOD["js/context/module"]:::jsOnly

    subgraph JS_REDUCERS ["js/context/reducers/"]
      direction TB
      JS_CTX_RED_MOD["reducers/module"]:::jsOnly
      JS_CTX_REDUCER["reducer<br/><i>reducer</i>"]:::jsOnly
      JS_CTX_STATE_ENTRY["stateReducerEntry<br/><i>stateValue, transition</i>"]:::jsLeaf
    end

    subgraph JS_DEFAULTS ["js/context/defaults/"]
      direction TB
      JS_CTX_DEF_MOD["defaults/module"]:::jsOnly
      JS_CTX_DEFAULT["defaultContext<br/><i>defaultContext</i>"]:::jsLeaf
    end
  end
  JS_CTX_MOD -->|"{ reducer: it.context.reducer }"| JS_CTX_RED_MOD
  JS_CTX_MOD -->|"{ defaultContext: it.context.defaultContext }"| JS_CTX_DEF_MOD
  JS_CTX_RED_MOD -->|"{ reducer }"| JS_CTX_REDUCER
  JS_CTX_REDUCER -->|"{ stateValue, transition }"| JS_CTX_STATE_ENTRY
  JS_CTX_STATE_ENTRY -->|"{ transition }"| SH_CTX_TRANS
  JS_CTX_DEF_MOD -->|it| JS_CTX_DEFAULT
  JS_CTX_DEFAULT -->|"{ transition }"| SH_CTX_TRANS

  %% ════════════════════════════════════════════════════
  %% JS-ONLY — CLASS
  %% ════════════════════════════════════════════════════
  subgraph JS_CLASS ["js/class/"]
    direction TB
    JS_CLS_MOD["js/class/module<br/><i>it (full)</i>"]:::jsOnly

    subgraph JS_STATIC ["js/class/static/"]
      direction TB
      JS_STATIC_MOD["static/module"]:::jsOnly
      JS_STATIC_GET_STATE["getState"]:::jsLeaf
      JS_STATIC_HAS_STATE["hasState<br/><i>it.className</i>"]:::jsLeaf
      JS_STATIC_GET_ACTION["getAction"]:::jsLeaf
      JS_STATIC_CREATE_ACTION["createAction<br/><i>it.className</i>"]:::jsLeaf
    end

    subgraph JS_REDUCER_CLS ["js/class/reducer/"]
      direction TB
      JS_RED_MOD["reducer/module"]:::jsOnly
      JS_ROOT_REDUCER["rootReducer<br/><i>it.byPassAction</i>"]:::jsOnly
      JS_STATE_VAL_HEAD["stateValidationHead"]:::jsLeaf
      JS_STATE_VAL_ERR["stateValidationError"]:::jsLeaf
      JS_ACTION_VAL["actionValidation"]:::jsLeaf
      JS_PRED_RES["newStatePredicateResolution"]:::jsLeaf
    end

    subgraph JS_VALIDATION ["js/class/validation/"]
      direction TB
      JS_STATE_VALIDATOR["stateValidator"]:::jsLeaf
      JS_ACTION_VALIDATOR["actionValidator"]:::jsLeaf
    end

    subgraph JS_LIFECYCLE ["js/class/lifecycle/"]
      direction TB
      JS_INIT_CTX["initContext"]:::jsLeaf
      JS_IS_KEY_OF["isKeyOf"]:::jsLeaf
    end
  end

  JS_CLS_MOD -->|it| JS_STATIC_MOD
  JS_STATIC_MOD -->|it| JS_STATIC_GET_STATE
  JS_STATIC_MOD -->|it| JS_STATIC_HAS_STATE
  JS_STATIC_MOD -->|it| JS_STATIC_GET_ACTION
  JS_STATIC_MOD -->|it| JS_STATIC_CREATE_ACTION

  JS_CLS_MOD -->|it| JS_RED_MOD
  JS_RED_MOD -->|it| JS_ROOT_REDUCER
  JS_ROOT_REDUCER --> JS_STATE_VAL_HEAD
  JS_ROOT_REDUCER --> JS_STATE_VAL_ERR
  JS_ROOT_REDUCER --> JS_ACTION_VAL
  JS_ROOT_REDUCER --> JS_PRED_RES

  JS_CLS_MOD -->|it| JS_STATE_VALIDATOR
  JS_CLS_MOD -->|it| JS_ACTION_VALIDATOR
  JS_CLS_MOD -->|it| JS_INIT_CTX
  JS_CLS_MOD -->|it| JS_IS_KEY_OF
  JS_CLS_MOD -->|it| SH_DICT_REGISTRIES

  %% ════════════════════════════════════════════════════
  %% TS-ONLY — TYPES
  %% ════════════════════════════════════════════════════
  subgraph TS_TYPES ["ts/types/"]
    direction TB
    TS_TYPES_MOD["ts/types/module<br/><i>(uses statesDictionary, actionsDictionary, FunctionDictionary, GenericAutomata)</i>"]:::tsLeaf
  end

  %% ════════════════════════════════════════════════════
  %% TS-ONLY — CONTEXT
  %% ════════════════════════════════════════════════════
  subgraph TS_CTX ["ts/context/"]
    direction TB
    TS_CTX_MOD["ts/context/module"]:::tsOnly
    TS_CTX_REDUCER["ts/context/reducer<br/><i>reducer</i>"]:::tsOnly
    TS_CTX_DEFAULT["ts/context/defaultContext<br/><i>defaultContext</i>"]:::tsLeaf
  end
  TS_CTX_MOD -->|"{ reducer: it.context.reducer }"| TS_CTX_REDUCER
  TS_CTX_MOD -->|"{ defaultContext: it.context.defaultContext }"| TS_CTX_DEFAULT
  TS_CTX_REDUCER -->|"{ transition: entry.transition }"| SH_CTX_TRANS
  TS_CTX_DEFAULT -->|"{ transition }"| SH_CTX_TRANS

  %% ════════════════════════════════════════════════════
  %% TS-ONLY — CLASS
  %% ════════════════════════════════════════════════════
  subgraph TS_CLASS ["ts/class/"]
    direction TB
    TS_CLS_MOD["ts/class/module<br/><i>it (full)</i>"]:::tsOnly
    TS_GET_STATE["getState<br/><i>(typed)</i>"]:::tsLeaf
    TS_HAS_STATE["hasState<br/><i>it.className (typed)</i>"]:::tsLeaf
    TS_GET_ACTION["getAction<br/><i>(typed)</i>"]:::tsLeaf
    TS_CREATE_ACTION["createAction<br/><i>it.className (typed)</i>"]:::tsLeaf
    TS_ROOT_REDUCER["rootReducer<br/><i>it.byPassAction (typed)</i>"]:::tsOnly
    TS_STATE_VAL_HEAD["stateValidationHead"]:::tsLeaf
    TS_STATE_VAL_ERR["stateValidationError"]:::tsLeaf
    TS_ACTION_VAL["actionValidation"]:::tsLeaf
    TS_PRED_RES["newStatePredicateResolution"]:::tsLeaf
    TS_STATE_VALIDATOR["stateValidator<br/><i>(typed)</i>"]:::tsLeaf
    TS_ACTION_VALIDATOR["actionValidator<br/><i>(typed)</i>"]:::tsLeaf
    TS_INIT_CTX["initContext"]:::tsLeaf
    TS_IS_KEY_OF["isKeyOf<br/><i>(typed)</i>"]:::tsLeaf
  end

  TS_CLS_MOD -->|it| TS_GET_STATE
  TS_CLS_MOD -->|it| TS_HAS_STATE
  TS_CLS_MOD -->|it| TS_GET_ACTION
  TS_CLS_MOD -->|it| TS_CREATE_ACTION
  TS_CLS_MOD -->|it| TS_ROOT_REDUCER
  TS_ROOT_REDUCER --> TS_STATE_VAL_HEAD
  TS_ROOT_REDUCER --> TS_STATE_VAL_ERR
  TS_ROOT_REDUCER --> TS_ACTION_VAL
  TS_ROOT_REDUCER --> TS_PRED_RES
  TS_CLS_MOD -->|it| TS_STATE_VALIDATOR
  TS_CLS_MOD -->|it| TS_ACTION_VALIDATOR
  TS_CLS_MOD -->|it| TS_INIT_CTX
  TS_CLS_MOD -->|it| TS_IS_KEY_OF
  TS_CLS_MOD -->|it| SH_DICT_REGISTRIES

  %% ════════════════════════════════════════════════════
  %% ENTRY: JS → children
  %% ════════════════════════════════════════════════════
  JS_MOD -->|it| SH_IMP_MOD
  JS_MOD -->|it| SH_FORK_MOD
  JS_MOD -->|it| SH_DICT_MOD
  JS_MOD -->|it| SH_FUNC_MOD
  JS_MOD -->|it| SH_EVT_MOD
  JS_MOD -->|it| JS_CTX_MOD
  JS_MOD -->|it| JS_CLS_MOD

  %% ════════════════════════════════════════════════════
  %% ENTRY: TS → children
  %% ════════════════════════════════════════════════════
  TS_MOD -->|it| SH_IMP_MOD
  TS_MOD -->|it| SH_FORK_MOD
  TS_MOD -->|it| SH_DICT_MOD
  TS_MOD -->|"it (uses it.className)"| TS_TYPES_MOD
  TS_MOD -->|it| SH_FUNC_MOD
  TS_MOD -->|it| SH_EVT_MOD
  TS_MOD -->|it| TS_CTX_MOD
  TS_MOD -->|it| TS_CLS_MOD
```

## Legend

| Color | Meaning |
|-------|---------|
| Dark green | JS entry point (`js/module.eta`) |
| Dark blue | TS entry point (`ts/module.eta`) |
| Purple | Shared templates (common for JS and TS) |
| Pink | Shared leaf templates (terminal, no includes) |
| Green | JS-only templates |
| Light green | JS-only leaf templates |
| Blue | TS-only templates |
| Light blue | TS-only leaf templates |

## Arrow notation

Each arrow `A -->|data| B` represents an `<%~ include('B', data) %>` call.

- **`it`** — the full data object passed as-is, without modifications
- **`{ key: it.path.to.value }`** — an object with specific fields picked from `it`
- **`{ ...it, registrations }`** — spread of `it` with added/overridden fields
- **No label** — include without passing data (uses variables from parent closure)

## Include order in entry points

### `js/module.eta` (7 steps)
1. `shared/imports/module` ← `it` (it.imports, it.importNamespaces)
2. `shared/forks/module` ← `it` (it.forks.predicates)
3. `shared/dictionaries/module` ← `it` (it.stateDictionary, it.actionDictionary, it.eventDictionary, it.dictionaries.*)
4. `shared/functions/module` ← `it` (it.functions.*)
5. `shared/events/module` ← `it` (it.events.*)
6. `js/context/module` ← `it` (it.context.*)
7. `js/class/module` ← `it` (it.className, it.initialStateValue, it.initialContext, it.byPassAction)

### `ts/module.eta` (8 steps)
1. `shared/imports/module` ← `it`
2. `shared/forks/module` ← `it`
3. `shared/dictionaries/module` ← `it`
4. `ts/types/module` ← `it` (inline: `export type TActions = keyof typeof actionsMap`)
5. `shared/functions/module` ← `it`
6. `shared/events/module` ← `it`
7. `ts/context/module` ← `it`
8. `ts/class/module` ← `it`

## Cross-directory includes

| From | To | Data |
|------|----|------|
| `js/context/reducers/stateReducerEntry` | `shared/context/reducers/contextTransition` | `{ transition }` |
| `js/context/defaults/defaultContext` | `shared/context/reducers/contextTransition` | `{ transition }` |
| `ts/context/reducer` | `shared/context/reducers/contextTransition` | `{ transition }` |
| `ts/context/defaultContext` | `shared/context/reducers/contextTransition` | `{ transition }` |
| `js/class/module` | `shared/dictionaries/runtime/runtimeRegistries` | `it` |
| `ts/class/module` | `shared/dictionaries/runtime/runtimeRegistries` | `it` |
| `shared/context/reducers/boundValuesItem` | `shared/expressions/context/defaultPropertyContext` | `{ path, identifier, expression }` |
| `shared/context/reducers/contextItemNoReducer` | `shared/expressions/context/defaultPropertyContext` | `{ path, identifier, expression }` |
| `shared/events/adapter/sourceValue` | `shared/expressions/context/defaultPropertyContext` | `{ path, identifier, expression }` |
| `shared/functions/registrations/registerDefine` | `shared/expressions/module` | `{ model: registration.bodyModel }` |
| `shared/expressions/calls/functionCall` | `shared/expressions/module` (recursive) | `{ model: arg }` |
