import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Константы для путей
const ROOT_DIR = path.resolve(__dirname, '../../');
const SOURCE_DIR = path.resolve(ROOT_DIR, 'docs');
const TARGET_DIR = path.resolve(__dirname, '../src');
const TEST_REPORTS_DIR = path.resolve(ROOT_DIR, 'test_reports');
const API_REFERENCE_DIR = path.resolve(__dirname, '../src/API-Reference');

async function copyDirectory(src, dest) {
	await fs.mkdir(dest, { recursive: true });
	await fs.cp(src, dest, { recursive: true });
}

async function processFiles(directory, fileFilter, processFunction) {
	const files = await fs.readdir(directory, { recursive: true, withFileTypes: true });
	const filteredFiles = files.filter(fileFilter);

	for (const file of filteredFiles) {
		await processFunction(file);
	}
}

async function preBuild() {
	await copyDirectory(SOURCE_DIR, TARGET_DIR);
}

async function typedocBuild() {
	execSync('npm run docs', { stdio: 'inherit' });

	await processFiles(
		TARGET_DIR,
		file => file.isFile() && file.name.toLowerCase() === 'readme.md',
		async (file) => {
			const oldPath = path.join(file.path, file.name);
			const newPath = path.join(file.path, 'index.md');
			await fs.rename(oldPath, newPath);
		},
	);

	await processFiles(
		TARGET_DIR,
		file => file.isFile() && path.extname(file.name) === '.md',
		async (file) => {
			const filePath = path.join(file.path, file.name);
			let content = await fs.readFile(filePath, 'utf-8');
			content = content.replace(/\]\(\.\/README\.md\)/g, '](/)');
			content = content.replace(/\]\((.*?)\/README\.md\)/g, ']($1)');
			await fs.writeFile(filePath, content);
		},
	);
}

async function testsBuild() {
	const files = await fs.readdir(TEST_REPORTS_DIR);

	for (const file of files) {
		const sourcePath = path.join(TEST_REPORTS_DIR, file);
		const packageName = path.basename(file, '.md');
		const destDir = path.join(API_REFERENCE_DIR, packageName, 'test_cases');

		await fs.mkdir(destDir, { recursive: true });
		await fs.copyFile(sourcePath, path.join(destDir, file));
	}
}

async function main() {
	try {
		console.log('Starting pre-build...');
		await preBuild();
		console.log('Pre-build completed.');

		console.log('Starting typedoc build...');
		await typedocBuild();
		console.log('Typedoc build completed.');

		console.log('Starting tests build...');
		await testsBuild();
		console.log('Tests build completed.');

		console.log('All build steps completed successfully.');
	} catch (error) {
		console.error('An error occurred during the build process:', error);
		process.exit(1);
	}
}

main();
