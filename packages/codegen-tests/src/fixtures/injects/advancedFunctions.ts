export function range(start: number, end: number): number[] {
	return Array.from({ length: end - start }, (_, i) => start + i);
}

export function sumArr(arr: number[]): number {
	return arr.reduce((a, b) => a + b, 0);
}

export function makePoint(x: number, y: number): { x: number; y: number } {
	return { x, y };
}

export function isPositiveNum(n: number): boolean {
	return n > 0;
}

export function funcA(): string {
	return 'A';
}

export function funcB(): string {
	return 'B';
}
