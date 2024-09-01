import { uniqId } from '@yantrix/utils';
import { IBaseClass } from '../types/index.js';

export class AbstractBaseClass implements IBaseClass {
	correlationId: string;

	constructor(...args: any[]) {
		(() => [...args])();
		this.correlationId = uniqId();
	}

	next(): this {
		return this;
	}
}
