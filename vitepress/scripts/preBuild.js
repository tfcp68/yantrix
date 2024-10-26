import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyDirectorySync } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '../../');

const SOURCE_DIR = path.resolve(ROOT_DIR, 'docs');
const TARGET_DIR = path.resolve(__dirname, '../src');

const TEST_REPORTS_DIR = path.resolve(ROOT_DIR, 'test_reports');
const API_REFERENCE_DIR = path.resolve(__dirname, '../src/API');

function preBuild() {
	copyDirectorySync(SOURCE_DIR, TARGET_DIR);
}

function processFilesSync(directory, fileFilter, processFunction) {
	const files = fs.readdirSync(directory, { withFileTypes: true });
	const filteredFiles = files.filter(fileFilter);

	for (const file of filteredFiles) {
		if (file.isDirectory()) {
			processFilesSync(path.join(directory, file.name), fileFilter, processFunction);
		} else {
			processFunction(file, directory);
		}
	}
}

function typedocBuild() {
	execSync('npm run docs', { stdio: 'inherit' });
	processFilesSync(
		TARGET_DIR,
		file => file.isFile() && file.name.toLowerCase() === 'readme.md',
		(file, dir) => {
			const oldPath = path.join(dir, file.name);
			const newPath = path.join(dir, 'index.md');
			fs.renameSync(oldPath, newPath);
		},
	);

	processFilesSync(
		TARGET_DIR,
		file => file.isFile() && path.extname(file.name) === '.md',
		(file, dir) => {
			const filePath = path.join(dir, file.name);
			let content = fs.readFileSync(filePath, 'utf-8');
			content = content.replace(/\]\(\.\/README\.md\)/g, '](/)');
			content = content.replace(/\]\((.*?)\/README\.md\)/g, ']($1)');
			fs.writeFileSync(filePath, content);
		},
	);
}

function testsBuild() {
	const files = fs.readdirSync(TEST_REPORTS_DIR);

	for (const file of files) {
		const sourcePath = path.join(TEST_REPORTS_DIR, file);
		const packageName = path.basename(file, '.md');
		const destDir = path.join(API_REFERENCE_DIR, packageName, 'test_cases');

		fs.mkdirSync(destDir, { recursive: true });
		fs.copyFileSync(sourcePath, path.join(destDir, file));
	}
}

function main() {
	try {
		console.log('Starting pre-build...');
		preBuild();
		console.log('Pre-build completed.');

		console.log('Starting typedoc build...');
		typedocBuild();
		console.log('Typedoc build completed.');

		console.log('Starting tests build...');
		testsBuild();
		console.log('Tests build completed.');

		console.log('All build steps completed successfully.');
	} catch (error) {
		console.error('An error occurred during the build process:', error);
		process.exit(1);
	}
}

main();
