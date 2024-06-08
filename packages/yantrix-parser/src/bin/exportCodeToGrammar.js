import fs, { constants } from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const grammarPath = args[0] ?? 'src/grammar/parserGrammar.jison';
const constantsPath = args[1] ?? 'dist/constants/index.js';
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
const replaceImportsInGrammar = (grammarData, constantsData) => {
	const importRegex = /import\s+\{[^}]+\}\s+from\s+['"]\.\/index\.js['"];?/;
	const exportRegexp = /export/g;

	const withoutExports = constantsData.replace(exportRegexp, '');

	return grammarData.replace(importRegex, withoutExports);
};

try {
	const grammarData = fs.readFileSync(grammarFilePath, 'utf8');
	const constantsData = fs.readFileSync(constantsFilePath, 'utf8');
	const updatedGrammarData = replaceImportsInGrammar(grammarData, constantsData);
	fs.access(outputFilePath, constants.F_OK && constants.R_OK, (err) => {
		if (err) {
			console.error('File is not writable or does not exist. Start build process first.');
			throw new Error(err.message);
		} else {
			console.log('File exists and is accessible');
			fs.writeFileSync(outputFilePath, updatedGrammarData, 'utf8');
			console.log('Successfully replaced imports with constants content.');
		}
	});
} catch (err) {
	console.error(`Error: ${err.message}`);
}
