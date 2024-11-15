import { execSync } from 'node:child_process';
import { camelCase } from 'lodash-es';

export function isJSON(str: string) {
	try {
		JSON.parse(str);
	} catch {
		return false;
	}
	return true;
};

export function isGitClean() {
	try {
		execSync('git diff-index --quiet HEAD --');
		return true;
	} catch {
		return false;
	}
}

export function toFilteredArgvs(argvs: string[], excluded: string[] = []) {
	const specials = ['$0', '_'];
	const filtered = [];

	for (const argv of argvs) {
		if (!specials.includes(argv)
			&& !excluded.includes(argv)
			&& argv === camelCase(argv)
			&& argv.length > 1
		) {
			filtered.push(argv);
		}
	}

	return filtered;
}
