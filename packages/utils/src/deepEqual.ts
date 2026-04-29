export function deepEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;

	if (a && b && typeof a === 'object' && typeof b === 'object') {
		if ((a as object).constructor !== (b as object).constructor) return false;

		if (Array.isArray(a) && Array.isArray(b)) {
			const length = a.length;
			if (length !== b.length) return false;
			for (let i = length; i-- !== 0;) {
				if (!deepEqual(a[i], b[i])) return false;
			}
			return true;
		}

		const aObj = a as Record<string, unknown>;
		const bObj = b as Record<string, unknown>;

		if (aObj.constructor === RegExp) {
			return (a as RegExp).source === (b as RegExp).source
				&& (a as RegExp).flags === (b as RegExp).flags;
		}

		if (aObj.valueOf !== Object.prototype.valueOf)
			return aObj.valueOf() === bObj.valueOf();

		if (aObj.toString !== Object.prototype.toString)
			return aObj.toString() === bObj.toString();

		const keys = Object.keys(aObj);
		const length = keys.length;
		if (length !== Object.keys(bObj).length) return false;

		for (let i = length; i-- !== 0;) {
			const key = keys[i]!;
			if (!Object.prototype.hasOwnProperty.call(bObj, key)) return false;
			if (!deepEqual(aObj[key], bObj[key])) return false;
		}

		return true;
	}

	return Number.isNaN(a) && Number.isNaN(b);
}
