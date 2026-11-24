import { InMemoryStorageAdapter } from '@yantrix/core';

export function connect(id: string) {
	return new InMemoryStorageAdapter<string>({ id });
}

export function connectNumbers(id: string) {
	return new InMemoryStorageAdapter<number>({ id });
}
