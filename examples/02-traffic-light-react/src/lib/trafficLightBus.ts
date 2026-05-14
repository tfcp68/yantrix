import { BasicEventBus } from '@yantrix/core';

export const SWITCH_EVENT = 10001;
export const RESET_EVENT = 10002;

// Singleton bus shared across all multi-light instances
export const trafficLightBus = new BasicEventBus();
