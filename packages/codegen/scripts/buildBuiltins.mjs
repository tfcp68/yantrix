/**
 * Generates two static template assets at build time:
 *  - src/core/templates/pure-js/runtime/builtins.js.tpl
 *    Bundled, self-contained JS block (no imports) that defines `builtInFunctions`.
 *  - src/core/templates/python/runtime/builtins.py.tpl
 *    Concatenated Python source from @yantrix/functions/src/python/ (requires pydash at runtime).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = resolve(__dirname, '..');

// Resolve @yantrix/functions via package registry (no hardcoded monorepo paths).
const _require = createRequire(import.meta.url);

function findPackageRoot(startDir) {
	let dir = startDir;
	while (dir !== dirname(dir)) {
		if (existsSync(resolve(dir, 'package.json')))
			return dir;
		dir = dirname(dir);
	}
	throw new Error(`Could not find package.json walking up from ${startDir}`);
}

const functionsEntry = _require.resolve('@yantrix/functions');
const functionsRoot = findPackageRoot(dirname(functionsEntry));

// ---------------------------------------------------------------------------
// JS builtins: bundle @yantrix/functions with vite (rollup under the hood)
// ---------------------------------------------------------------------------

const jsDst = resolve(pkg, 'src/core/templates/pure-js/runtime/builtins.js.tpl');
mkdirSync(dirname(jsDst), { recursive: true });

const funcsSrc = resolve(functionsRoot, 'src/index.ts');
if (!existsSync(funcsSrc)) {
	throw new Error(`@yantrix/functions source not found: ${funcsSrc}`);
}

// Fallback: resolve @yantrix/* to their src when dist is absent (monorepo dev).
const workspaceFallbackPlugin = {
	name: 'workspace-fallback',
	resolveId(source) {
		if (!source.startsWith('@yantrix/'))
			return null;
		const pkgName = source.replace(/^@yantrix\//, '');
		try {
			const pkgRoot = dirname(_require.resolve(`@yantrix/${pkgName}/package.json`));
			const distEntry = resolve(pkgRoot, 'dist/index.js');
			if (!existsSync(distEntry)) {
				const srcEntry = resolve(pkgRoot, 'src/index.ts');
				if (existsSync(srcEntry))
					return srcEntry;
			}
		}
		catch { /* not a workspace package, let rollup resolve normally */ }
		return null;
	},
};

const result = await build({
	configFile: false,
	logLevel: 'silent',
	build: {
		write: false,
		lib: {
			entry: funcsSrc,
			formats: ['es'],
			fileName: 'builtins',
		},
		rollupOptions: {
			external: [],
			treeshake: true,
			plugins: [workspaceFallbackPlugin],
			output: { preserveModules: false },
		},
		minify: false,
		target: 'es2022',
	},
});

const allOutputs = Array.isArray(result) ? result : [result];
const chunks = allOutputs[0].output.filter(o => o.type === 'chunk');

// Strip all `export { ... };` lines - we want bare declarations inlineable into any module.
let jsCode = chunks.map(c => c.code).join('\n');
jsCode = jsCode
	.replace(/^export\s*\{[^}]*\};\s*$/gm, '')
	.trimEnd();

if (!jsCode.includes('builtInFunctions')) {
	throw new Error('Bundled JS builtins do not contain "builtInFunctions" - check vite output');
}

writeFileSync(jsDst, `${jsCode}\n`);
console.log(`JS builtins written: ${jsDst}`);

// ---------------------------------------------------------------------------
// Python builtins: concatenate @yantrix/functions/src/python/*.py
// Note: generated Python code requires `pydash` as a runtime peer dependency.
// ---------------------------------------------------------------------------

const pyDst = resolve(pkg, 'src/core/templates/python/runtime/builtins.py.tpl');
mkdirSync(dirname(pyDst), { recursive: true });

const pySrcDir = resolve(functionsRoot, 'src/python');
const pyFiles = ['conditionals.py', 'predicates.py', 'transformers.py'];
const pySrcExists = pyFiles.every(f => existsSync(resolve(pySrcDir, f)));

if (!pySrcExists) {
	console.log(`Python builtins source not found at ${pySrcDir} - keeping existing template.`);
}
else {
	const importLines = new Set();
	const bodyLines = [];

	for (const file of pyFiles) {
		const src = resolve(pySrcDir, file);
		const lines = readFileSync(src, 'utf8').split('\n');
		let i = 0;
		while (i < lines.length) {
			const line = lines[i];
			const trimmed = line.trim();
			if (trimmed.startsWith('from ') || trimmed.startsWith('import ')) {
				if (trimmed.endsWith('(')) {
					let block = line;
					i++;
					while (i < lines.length) {
						block += `\n${lines[i]}`;
						if (lines[i].trim().endsWith(')')) {
							i++;
							break;
						}
						i++;
					}
					importLines.add(block);
				}
				else {
					importLines.add(line);
					i++;
				}
			}
			else {
				bodyLines.push(line);
				i++;
			}
		}
	}

	const pyContent = [
		'# --- Python builtins (auto-generated from @yantrix/functions/src/python/) ---',
		'# Requires: pydash (pip install pydash)',
		'',
		...[...importLines],
		'',
		...bodyLines,
	].join('\n');

	writeFileSync(pyDst, pyContent);
	console.log(`Python builtins written: ${pyDst}`);
}
