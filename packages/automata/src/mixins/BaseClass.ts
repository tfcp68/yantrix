import { uniqId } from '@yantrix/utils';
import { IBaseClass } from '../types/index.js';

export class AbstractBaseClass implements IBaseClass {
	readonly correlationId: string;
	static readonly BASE_ID_LENGTH = 12;

	constructor(...args: any[]) {
		this.correlationId = uniqId(AbstractBaseClass.BASE_ID_LENGTH + (args || []).length);
	}

	next(): this {
		return this;
	}
}
