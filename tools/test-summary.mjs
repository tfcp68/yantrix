/* eslint-disable no-console */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const reportsDir = join(__dirname, '..', 'test_reports');

if (!existsSync(reportsDir)) {
	console.log('No test reports found at test_reports/');
	process.exit(0);
}

const files = readdirSync(reportsDir).filter(f => f.endsWith('.md'));
if (files.length === 0) {
	console.log('No .md files in test_reports/');
	process.exit(0);
}

const results = files.map((file) => {
	const content = readFileSync(join(reportsDir, file), 'utf8');
	const name = file.replace('.md', '');
	const suitesMatch = content.match(/\|Test Suites\|(\d+)\|(\d+)\|(\d+)\|(\d+)\|(\d+)\|/);
	const testsMatch = content.match(/\|Tests\|(\d+)\|(\d+)\|(\d+)\|(\d+)\|(\d+)\|/);
	return {
		name,
		suites: suitesMatch ? +suitesMatch[5] : 0,
		passed: testsMatch ? +testsMatch[1] : 0,
		failed: testsMatch ? +testsMatch[2] : 0,
		total: testsMatch ? +testsMatch[5] : 0,
	};
});

const nameW = Math.max(7, ...results.map(r => r.name.length));

function row(name, suites, passed, failed, total, mark = '') {
	return `${name.padEnd(nameW)} | ${String(suites).padStart(6)} | ${String(passed).padStart(6)} | ${String(failed).padStart(6)} | ${String(total).padStart(5)}${mark}`;
}

const sep = '-'.repeat(nameW + 38);

console.log('\n-- Test Summary --');
console.log(sep);
console.log(row('Package', 'Suites', 'Passed', 'Failed', 'Total'));
console.log(sep);
for (const r of results)
	console.log(row(r.name, r.suites, r.passed, r.failed, r.total, r.failed > 0 ? ' !' : ''));
console.log(sep);
const tot = results.reduce(
	(a, r) => ({
		suites: a.suites + r.suites,
		passed: a.passed + r.passed,
		failed: a.failed + r.failed,
		total: a.total + r.total,
	}),
	{ suites: 0, passed: 0, failed: 0, total: 0 },
);
console.log(row('TOTAL', tot.suites, tot.passed, tot.failed, tot.total));
console.log(`${sep}\n`);

if (tot.failed > 0)
	process.exit(1);
