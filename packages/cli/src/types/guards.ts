import { isString } from 'es-toolkit';

export function isProvided(e?: string): e is string {
	return isString(e) && e.trim() !== '';
}
