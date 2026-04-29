import { exec } from 'node:child_process';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { Listr } from 'listr2';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(script) {
	return () => new Promise((resolve, reject) => {
		exec(`pnpm run ${script}`, { cwd: root, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
			if (err)
				reject(new Error(stdout + stderr));
			else resolve();
		});
	});
}

const tasks = new Listr([
	{ title: '[1/4] @yantrix/* packages', task: run('build:yantrix') },
	{ title: '[2/4] remaining packages', task: run('build:rest') },
	{ title: '[3/4] generating code', task: run('generate:packages') },
	{ title: '[4/4] examples', task: run('build:examples') },
], { concurrent: false });

tasks.run().catch(() => {
	process.exitCode = 1;
});
