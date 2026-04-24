/* eslint-disable no-console */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const packagesDir = join(root, 'packages');

function walkTs(dir) {
	if (!existsSync(dir))
		return { files: 0, lines: 0 };
	let files = 0;
	let lines = 0;
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			const sub = walkTs(full);
			files += sub.files;
			lines += sub.lines;
		}
		else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
			files++;
			lines += readFileSync(full, 'utf8').split('\n').length;
		}
	}
	return { files, lines };
}

function countDistFiles(dir) {
	if (!existsSync(dir))
		return 0;
	return readdirSync(dir, { withFileTypes: true }).filter(e => e.isFile()).length;
}

const pkgs = readdirSync(packagesDir, { withFileTypes: true })
	.filter(e => e.isDirectory())
	.map((e) => {
		const pkgDir = join(packagesDir, e.name);
		const pkgJsonPath = join(pkgDir, 'package.json');
		const name = existsSync(pkgJsonPath)
			? (JSON.parse(readFileSync(pkgJsonPath, 'utf8')).name || e.name)
			: e.name;
		const src = walkTs(join(pkgDir, 'src'));
		const gen = walkTs(join(pkgDir, 'src', 'generated'));
		const dist = countDistFiles(join(pkgDir, 'dist'));
		return { name, srcFiles: src.files, srcLoc: src.lines, genLoc: gen.lines, dist };
	});

const nameW = Math.max(7, ...pkgs.map(p => p.name.length));

function row(name, sf, loc, gen, dist) {
	return `${name.padEnd(nameW)} | ${String(sf).padStart(9)} | ${String(loc).padStart(7)} | ${String(gen).padStart(9)} | ${String(dist).padStart(10)}`;
}

const sep = '-'.repeat(nameW + 47);

console.log('\n-- Build Summary --');
console.log(sep);
console.log(row('Package', 'Src files', 'LoC', 'Generated', 'Dist files'));
console.log(sep);
for (const p of pkgs)
	console.log(row(p.name, p.srcFiles, p.srcLoc, p.genLoc, p.dist));
console.log(sep);
const tot = pkgs.reduce(
	(a, p) => ({
		srcFiles: a.srcFiles + p.srcFiles,
		srcLoc: a.srcLoc + p.srcLoc,
		genLoc: a.genLoc + p.genLoc,
		dist: a.dist + p.dist,
	}),
	{ srcFiles: 0, srcLoc: 0, genLoc: 0, dist: 0 },
);
console.log(row('TOTAL', tot.srcFiles, tot.srcLoc, tot.genLoc, tot.dist));
console.log(`${sep}\n`);
