export function isProvided(e?: string): e is string {
	return typeof e === 'string' && e.trim() !== '';
}
