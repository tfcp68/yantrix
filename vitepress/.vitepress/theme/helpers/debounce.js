export function debounce(fn, delay) {
	let timer = null;
	return function (...args) {
		const context = this;
		clearTimeout(timer);
		timer = setTimeout(() => {
			fn.apply(context, args);
		}, delay);
	};
}
