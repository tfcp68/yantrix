import { isString } from 'lodash-es';

export function isProvided(e?: string): e is string {
	return isString(e) && e.trim() !== '';
}
