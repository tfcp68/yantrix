import { uniqId } from '@yantrix/utils'
import type { IBaseClass } from '../types/index.js'

export class AbstractBaseClass implements IBaseClass {
	correlationId: string

	constructor(...args: any[]) {
		(() => [...args])()
		this.correlationId = uniqId()
	}

	next(): this {
		return this
	}
}
