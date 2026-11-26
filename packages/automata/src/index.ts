/**
 * @packageDocumentation
 *
 * The `@yantrix/automata` package is a foundational component of the Yantrix framework,
 * designed to create and manage finite state machines (FSMs) with type-safe transitions and event handling in TypeScript.
 *
 * Its core purpose is to:
 * - Provide the core building blocks for Yantrix FSMs
 * - Enable the creation of complex state machines with minimal boilerplate
 * - Ensure that all state transitions and event handling are type-safe
 *
 */

export * from './ActionDictionary.js';
export * from './Automata.js';
export * from './AutomataSlice.js';
export * from './CoreLoop.js';
export * from './DataDestination.js';
export * from './DataModel.js';
export * from './DataSource.js';
export * from './EffectScheduler.js';
export * from './EventAdapter.js';
export * from './EventBus.js';
export * from './EventDictionary.js';
export * from './FunctionDictionary.js';
export * from './IOPromiseAdapter.js';
export * from './mixins/BaseClass.js';
export * from './mixins/BasicActionContainer.js';
export * from './mixins/BasicEventContainer.js';
export * from './mixins/BasicStateContainer.js';
export * from './mixins/BasicValidatorContainer.js';
export * from './mixins/DictionaryContainer.js';
export * from './mixins/ExtendedActionContainer.js';
export * from './mixins/ExtendedEventContainer.js';
export * from './mixins/ExtendedStateContainer.js';
export * from './mixins/ExtendedValidatorContainer.js';
export * from './ModelFunctions.js';
export * from './ModelUpdates.js';
export * from './ModelValidation.js';
export * from './StateDictionary.js';
export * from './Storage.js';
export * from './TimedCoreLoop.js';
export * from './types/index.js';
