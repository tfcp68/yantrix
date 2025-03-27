import { TNullable } from '@yantrix/utils';
import { TImports, TProcessImport } from './types';

const getImport = ({ key, value }: TProcessImport) => `import { ${value.join(', ')} } from '${key}';\n`;
const getNamespaceImport = ({ key, value }: TProcessImport) => `import * as ${value[0]} from '${key}';\n`;

const processRecordImports = (importsRecord: TImports, processImport: ({ key, value }: TProcessImport) => string) => {
	let imports = '';

	for (const [key, value] of Object.entries(importsRecord)) {
		imports += processImport({ key, value });
	}
	return imports;
};

export function getImportsCode(props: { imports: TImports }) {
	return processRecordImports(props.imports, getImport);
}

export function importAll(props: { importNamespaces: TNullable<TImports> }) {
	if (!props.importNamespaces) return '';
	return processRecordImports(props.importNamespaces, getNamespaceImport);
}

export const importsSerializer = {
	getImportsCode,
	importAll,
};
