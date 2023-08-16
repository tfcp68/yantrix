import { uniqId } from '@yantrix/utils';
import { IBaseClass } from '../types/index.js';

export class AbstractBaseClass implements IBaseClass {
	correlationId: string;

	constructor(...args: any[]) {
		this.correlationId = uniqId();
	}

	next() {
		return this;
	}
}
