import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const grammarPath = args[0] ?? 'src/grammar/parserGrammar.jison';
const constantsPath = args[1] ?? 'dist/grammar/jsGrammar.js';
const outputPath = args[2] ?? 'src/grammar/parserGrammarWithoutImports.jison';
const grammarFilePath = path.resolve(grammarPath);
const constantsFilePath = path.resolve(constantsPath);
const outputFilePath = path.resolve(outputPath);

/**
 * Replaces imports in the grammar file with the content of the constants file
 * @param {string} grammarData - The content of the grammar file
 * @param {string} constantsData - The content of the constants file
 * @returns {string} - The updated grammar data with imports replaced
 */
function replaceImportsInGrammar(grammarData, constantsData) {
	const importRegex = /import\s+\{[^}]+\}\s+from\s+['"]\.\/(grammar\/jsGrammar|index)\.js['"];?/g;
	const exportRegexp = /export/g;

	const withoutExports = constantsData.replace(exportRegexp, '');

	return grammarData.replace(importRegex, withoutExports);
}

try {
	const grammarData = fs.readFileSync(grammarFilePath, 'utf8');
	const constantsData = fs.readFileSync(constantsFilePath, 'utf8');
	const updatedGrammarData = replaceImportsInGrammar(grammarData, constantsData);
	fs.writeFileSync(outputFilePath, updatedGrammarData, {
		encoding: 'utf8',
		flag: 'w',
	});

	console.info('Successfully replaced imports with constants content.');
} catch (err) {
	console.error(`Error: ${err.message}`);
}
