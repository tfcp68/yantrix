import { createTsupConfig } from '../../tsup.config.js';
import packageJson from './package.json';

const entry = Object.fromEntries(Object.keys(packageJson.exports).map((subpath) => {
	const name = subpath === '.' ? 'index' : subpath.slice(2);
	const source = name === 'types' ? 'types/index' : name;
	return [name, `src/${source}.ts`];
}));

export default createTsupConfig({ entry, splitting: true });
