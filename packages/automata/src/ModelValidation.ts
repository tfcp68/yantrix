function serializabilityError(path: string, reason: string): never {
	throw new TypeError(`Data Model value at ${path} is not serializable: ${reason}`);
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
			for (let index = 0; index < value.length; index++) {
				if (!Object.prototype.hasOwnProperty.call(value, index)) {
					serializabilityError(`${path}[${index}]`, 'sparse array item');
				}
				assertSerializableValue(value[index], `${path}[${index}]`, ancestors);
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
			if (!descriptor.enumerable || !('value' in descriptor)) {
				serializabilityError(`${path}.${key}`, 'only enumerable data properties are allowed');
			}
			assertSerializableValue(descriptor.value, `${path}.${key}`, ancestors);
		}
	} finally {
		ancestors.delete(value);
	}
}

/**
 * Validates the strict, lossless JSON subset used for an anemic Data Model.
 * Dates, class instances, accessors, sparse arrays, and circular references are
 * rejected even when JSON.stringify would silently coerce or omit them.
 */
export function assertSerializableModel(model: unknown): asserts model is object {
	if (typeof model !== 'object' || model === null) {
		throw new TypeError('Data Model must be a non-null object');
	}
	assertSerializableValue(model, '$', new WeakSet());
}

/** Deeply freezes an Object graph in-place, safely handling shared/cyclic references. */
export function deepFreezeModel<ModelType extends object>(model: ModelType): Readonly<ModelType> {
	const visited = new WeakSet<object>();
	const freeze = (value: object): void => {
		if (visited.has(value)) return;
		visited.add(value);
		for (const key of Reflect.ownKeys(value)) {
			const descriptor = Object.getOwnPropertyDescriptor(value, key);
			if (!descriptor || !('value' in descriptor)) continue;
			const child = descriptor.value;
			if ((typeof child === 'object' && child !== null) || typeof child === 'function') {
				freeze(child as object);
			}
		}
		Object.freeze(value);
	};
	freeze(model);
	return model;
}
