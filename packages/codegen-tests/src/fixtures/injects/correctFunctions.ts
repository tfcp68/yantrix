export const isBoolean = (value: any) => typeof value === 'boolean';

export function isString(value: any): boolean {
	return typeof value === 'string';
}
export function validateInput(data: any): boolean {
	return isBoolean(data) || (isString(data) && data.length > 0);
}
export function processData(input: any): any {
	return {
		processed: true,
		originalValue: input,
		timestamp: Date.now(),
	};
}
function testDefault() {
	return true;
}

export default testDefault;
