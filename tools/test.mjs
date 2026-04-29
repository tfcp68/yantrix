import { exec } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { Listr } from 'listr2';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function scanDir(base, depth = 0) {
	if (!existsSync(base))
		return [];
	const results = [];
	for (const entry of readdirSync(base, { withFileTypes: true })) {
		if (!entry.isDirectory())
			continue;
		const dir = join(base, entry.name);
		const pkgPath = join(dir, 'package.json');
		if (existsSync(pkgPath)) {
			const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
			if (pkg.scripts?.test?.includes('vitest')) {
				results.push({ name: pkg.name ?? entry.name, cwd: dir });
			}
		}
		if (depth < 1)
			results.push(...scanDir(dir, depth + 1));
	}
	return results;
}

const packages = [
	...scanDir(join(root, 'packages')),
	...scanDir(join(root, 'examples')),
	...scanDir(join(root, 'comparison')),
];

function run(cwd) {
	return () => new Promise((resolve, reject) => {
		exec('pnpm run test', { cwd, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
			if (err)
				reject(new Error(stdout + stderr));
			else resolve();
		});
	});
}

const tasks = new Listr(
	packages.map(({ name, cwd }) => ({ title: name, task: run(cwd) })),
	{ concurrent: 4 },
);

tasks.run().catch(() => {
	process.exitCode = 1;
});
