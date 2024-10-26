import { TImports } from './types';

export function getImportsCode(props: {
	imports: TImports;
}) {
	let imports = '';
	for (const [key, value] of Object.entries(props.imports)) {
		imports += `import { ${value.join(', ')} } from '${key}';\n`;
	}
	return imports;
}

export const importsSerializer = {
	getImportsCode,
};
