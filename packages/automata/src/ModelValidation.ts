function serializabilityError(path: string, reason: string): never {
	throw new TypeError(`Data Model value at ${path} is not serializable: ${reason}`);
}

function dataPropertyValue(descriptor: PropertyDescriptor, path: string): unknown {
	if (!descriptor.enumerable || !('value' in descriptor)) {
		serializabilityError(path, 'only enumerable data properties are allowed');
	}
	return descriptor.value;
}

function assertSerializableValue(value: unknown, path: string, ancestors: WeakSet<object>): void {
	if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
	if (typeof value === 'number') {
		if (!Number.isFinite(value)) serializabilityError(path, 'numbers must be finite');
		return;
	}
	if (typeof value !== 'object') serializabilityError(path, `unsupported ${typeof value} value`);

	if (ancestors.has(value)) serializabilityError(path, 'circular reference');
	ancestors.add(value);

	try {
		if (Array.isArray(value)) {
			if (Object.getPrototypeOf(value) !== Array.prototype) {
				serializabilityError(path, 'only plain Arrays are allowed');
			}
			for (let index = 0; index < value.length; index++) {
				const itemPath = `${path}[${index}]`;
				const descriptor = Object.getOwnPropertyDescriptor(value, index);
				if (!descriptor) serializabilityError(itemPath, 'sparse array item');
				assertSerializableValue(dataPropertyValue(descriptor, itemPath), itemPath, ancestors);
			}
			const allowedKeys = new Set<PropertyKey>([
				'length',
				...Array.from({ length: value.length }, (_, index) => String(index)),
			]);
			for (const key of Reflect.ownKeys(value)) {
				if (!allowedKeys.has(key)) serializabilityError(path, `unsupported Array property ${String(key)}`);
			}
			return;
		}

		const prototype = Object.getPrototypeOf(value);
		if (prototype !== Object.prototype && prototype !== null) {
			serializabilityError(path, 'only plain Objects and Arrays are allowed');
		}

		for (const key of Reflect.ownKeys(value)) {
			if (typeof key === 'symbol') serializabilityError(path, 'symbol keys are not supported');
			const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
			const propertyPath = `${path}.${key}`;
			assertSerializableValue(dataPropertyValue(descriptor, propertyPath), propertyPath, ancestors);
		}
	} finally {
		ancestors.delete(value);
	}
}

/**
 * Validates the strict, lossless JSON subset used for an anemic `Data Model`.
 * Dates, class instances, accessors, sparse arrays, and circular references are
 * rejected even when `JSON.stringify` would silently coerce or omit them.
 */
export function assertSerializableModel(model: unknown): asserts model is object {
	if (typeof model !== 'object' || model === null) {
		throw new TypeError('Data Model must be a non-null object');
	}
	assertSerializableValue(model, '$', new WeakSet());
}

const deeplyFrozen = new WeakSet<object>();

/** Deeply freezes the own data properties of a `Data Model`, including shared and cyclic references. */
export function deepFreezeModel<ModelType extends object>(model: ModelType): Readonly<ModelType> {
	if (deeplyFrozen.has(model)) return model;

	const visited = new Set<object>([model]);
	// Set iteration also visits children added during traversal, once per object.
	for (const value of visited) {
		Object.freeze(value);
		for (const key of Reflect.ownKeys(value)) {
			const descriptor = Object.getOwnPropertyDescriptor(value, key);
			if (!descriptor || !('value' in descriptor)) continue;
			const child = descriptor.value;
			if (((typeof child === 'object' && child !== null) || typeof child === 'function') && !deeplyFrozen.has(child)) {
				visited.add(child);
			}
		}
	}

	// A cycle can reach an unfinished ancestor. Cache the graph only after every freeze succeeds.
	for (const value of visited) deeplyFrozen.add(value);
	return model;
}
