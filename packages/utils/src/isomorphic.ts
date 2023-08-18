export function microtime() {
	let mt = 0;
	if (typeof process !== 'undefined' && process?.hrtime)
		mt = (new Date().getTime() * 1e9 + process.hrtime()[1]) / 8.64e13;
	else if (performance) mt = performance.now();
	else mt = (new Date().getTime() + Math.random()) / 86400;
	return parseInt(Math.floor(mt * 1e5).toString(10));
}
