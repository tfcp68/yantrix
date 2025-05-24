import { uniqId } from '@yantrix/utils';
import { IBaseClass } from '../types/index.js';

export class AbstractBaseClass implements IBaseClass {
	readonly correlationId: string=uniqId();

	constructor(...args: any[]) {
    console.warn('Base class args:', args);
	}

	next(): this {
		return this;
	}
}
