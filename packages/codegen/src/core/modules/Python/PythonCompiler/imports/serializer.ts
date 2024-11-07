import { TImports } from './types';

export function getImportsCode(props: {
	imports: TImports;
}) {
	const imports = [];
	for (const [key, value] of Object.entries(props.imports)) {
		imports.push(`from '${key} import ${value.join(', ')}`);
	}
	return imports.join('\n');
}

export const importsSerializer = {
	getImportsCode,
};
