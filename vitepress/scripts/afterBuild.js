import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyDirectorySync } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.resolve(__dirname, '../../examples');

const TARGET_DIR = path.resolve(__dirname, '../.vitepress/dist/examples');

async function copyExamples() {
	try {
		fs.mkdirSync(TARGET_DIR, { recursive: true });

		const examples = fs.readdirSync(SOURCE_DIR);

		for (const exampleName of examples) {
			const distPath = path.join(SOURCE_DIR, exampleName, 'dist');
			if (fs.existsSync(distPath) && fs.statSync(distPath).isDirectory()) {
				const destDir = path.join(TARGET_DIR, exampleName);
				try {
					copyDirectorySync(distPath, destDir);
					console.log(`Copied ${exampleName} to ${destDir}`);
				} catch (err) {
					console.error(`Error copying ${exampleName}: ${err.message}`);
				}
			} else {
				console.warn(`Skipping ${exampleName}: 'dist' directory not found or not a directory`);
			}
		}

		console.log('All dist directories have been processed.');
	} catch (err) {
		console.error('An error occurred:', err);
	}
}

copyExamples();
