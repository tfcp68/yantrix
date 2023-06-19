import { IBaseClass } from '../types/index.js';

export class AbstractBaseClass implements IBaseClass {
	next() {
		return this;
	}
}
