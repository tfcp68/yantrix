import fs, {constants} from 'fs';
import path from 'path';
import ts from 'typescript';

const args = process.argv.slice(2)
const grammarPath = args[0] ?? 'src/grammar/parserGrammar.jison';
const constantsPath = args[1] ?? 'src/constants/index.ts';
const outputPath = args[2] ?? 'src/grammar/parserGrammarWithoutImports.jison';
const grammarFilePath = path.resolve(grammarPath);
const constantsFilePath = path.resolve(constantsPath);
const outputFilePath = path.resolve(outputPath);

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

try {
	const grammarData = fs.readFileSync(grammarFilePath, 'utf8');
	const constantsData = fs.readFileSync(constantsFilePath, 'utf8');
	const updatedGrammarData = replaceImportsInGrammar(grammarData, constantsData);
	fs.access(outputFilePath, constants.F_OK && constants.R_OK, (err) => {
		if(err) {
			console.error('File is not writable or does not exist');
			throw new Error(err)
		} else {
			console.log('File exists and is accessible');
			fs.writeFileSync(outputFilePath, updatedGrammarData, 'utf8');
			console.log('Successfully replaced imports with constants content.');
		}
	})
} catch (err) {
	console.error(`Error: ${err}`);
}
