import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ts from 'typescript';

// eslint-disable-next-line @typescript-eslint/naming-convention
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = path.dirname(__filename);

const grammarFilePath = path.join(__dirname, '../grammar/parserGrammar.jison');

const constantsFilePath = path.join(__dirname, '../constants/index.ts');

const outputFilePath = path.join(__dirname, '../grammar/parserGrammarWithoutImports.jison');

/**
 * Замена импортов в файле грамматики на содержимое файла с константами
 * @param grammarData
 * @param constantsData
 * @returns {*}
 */
const replaceImportsInGrammar = (grammarData, constantsData) => {
	const importRegex = /import\s+\{[^}]+\}\s+from\s+['"]\.\/index\.js['"];?/;
	const exportRegexp = /export/g;

	const withoutExports = constantsData.replace(exportRegexp, '');

	const { outputText } = ts.transpileModule(withoutExports, {
		module: ts.ModuleKind.ESNext
	});

	return grammarData.replace(importRegex, outputText);

}

fs.readFile(grammarFilePath, 'utf8', (err, grammarData) => {
	if (err) {
		console.error(`Error reading grammar file: ${err}`);
		return;
	}

	fs.readFile(constantsFilePath, 'utf8', (err, constantsData) => {
		if (err) {
			console.error(`Error reading constants file: ${err}`);
			return;
		}
		const updatedGrammarData = replaceImportsInGrammar(grammarData, constantsData);

		fs.writeFile(outputFilePath, updatedGrammarData, 'utf8', (err) => {
			if (err) {
				console.error(`Error writing updated grammar file: ${err}`);
				return;
			}

			console.log('Successfully replaced imports with constants content.');
		});
	});
});
