import fs from 'node:fs';
import path from 'node:path';

import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Путь к исходной директории
const SOURCE_DIR = path.resolve(__dirname, '../../examples');

// Путь к целевой директории
const TARGET_DIR = path.resolve(__dirname, '../.vitepress/dist/examples');

// Функция для рекурсивного копирования директории
function copyDir(src, dest) {
	fs.mkdirSync(dest, { recursive: true });
	const entries = fs.readdirSync(src, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		if (entry.isDirectory()) {
			copyDir(srcPath, destPath);
		} else {
			fs.copyFileSync(srcPath, destPath);
		}
	}
}

// Находим и копируем файлы из всех dist директорий
fs.readdirSync(SOURCE_DIR).forEach((exampleName) => {
	const distPath = path.join(SOURCE_DIR, exampleName, 'dist');
	if (fs.existsSync(distPath) && fs.statSync(distPath).isDirectory()) {
		const destDir = path.join(TARGET_DIR, exampleName);
		copyDir(distPath, destDir);
		console.log(`Copied ${exampleName} to ${destDir}`);
	}
});

console.log('All dist directories have been copied successfully.');
