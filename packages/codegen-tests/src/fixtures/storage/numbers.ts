import { createInMemoryStorageAdapter } from '@yantrix/storage';

export const connectNumbers = createInMemoryStorageAdapter<number>;
