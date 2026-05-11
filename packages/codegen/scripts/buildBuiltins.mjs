/**
 * Generates two static template assets at build time:
 *  - src/core/templates/pure-js/runtime/builtins.js.tpl
 *    Bundled, self-contained JS block (no imports) that defines `builtInFunctions`.
 *  - src/core/templates/python/runtime/builtins.py.tpl
 *    Concatenated Python source from @yantrix/functions/src/python/ (pure Python, no external deps).
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

/**
 * Transform flat Vite bundle output into marker-annotated format.
 * Each exported builtin gets // @@begin: name / // @@end: name wrappers
 * so filterBuiltinsJS in codegen.ts can include only referenced functions.
 *
 * Strategy:
 *   1. Parse Object.freeze() blocks to build jsId -> [exportName] map
 *   2. Find alias lines (const all = and) and merge into canonical jsId
 *   3. Find def line range for each jsId (indentation-based end detection)
 *   4. Mark lines to skip: freeze blocks, spread assignments, alias lines
 *   5. Remaining lines -> preamble (always included)
 *   6. Output: preamble + const builtInFunctions = {}; + marked blocks
 */
function addMarkersToBundle(raw) {
	const lines = raw.split('\n');

	// Step 1: parse freeze blocks -> exportMap: jsId -> exportName[]
	const exportMap = new Map();
	for (let i = 0; i < lines.length; i++) {
		if (!/^const \w+ = \/\* @__PURE__ \*\/ Object\.freeze\(/.test(lines[i]))
			continue;
		i++;
		while (i < lines.length) {
			const t = lines[i].trim();
			if (t.startsWith('}') || t.startsWith('Symbol'))
				break;
			if (t === '__proto__: null,' || t === '__proto__: null') {
				i++;
				continue;
			}
			const colonM = t.match(/^(\w+):\s*(\w+),?$/);
			const shortM = !colonM && t.match(/^(\w+),?$/);
			if (colonM) {
				const [, exportName, jsId] = colonM;
				if (!exportMap.has(jsId))
					exportMap.set(jsId, []);
				exportMap.get(jsId).push(exportName);
			}
			else if (shortM) {
				const name = shortM[1];
				if (!exportMap.has(name))
					exportMap.set(name, []);
				exportMap.get(name).push(name);
			}
			i++;
		}
	}

	// Step 2: find alias lines (const all = and;) and merge
	const exportedJsIds = new Set(exportMap.keys());
	const aliasMap = new Map(); // alias jsId -> canonical jsId
	for (const line of lines) {
		const m = line.match(/^const (\w+) = (\w+);$/);
		if (m && exportedJsIds.has(m[1]) && exportedJsIds.has(m[2]))
			aliasMap.set(m[1], m[2]);
	}
	for (const [alias, canonical] of aliasMap) {
		const exports = exportMap.get(alias) ?? [];
		if (!exportMap.has(canonical))
			exportMap.set(canonical, []);
		exportMap.get(canonical).push(...exports);
		exportMap.delete(alias);
	}
	const aliasIds = new Set(aliasMap.keys());

	// Step 3: find definition ranges
	// End detection: single-line if ends with ; (not {); multi-line: find } or }; at col 0
	function findDefEnd(startIdx) {
		const first = lines[startIdx].trimEnd();
		if (first.endsWith(';') && !first.endsWith('{'))
			return startIdx;
		for (let k = startIdx + 1; k < lines.length; k++) {
			if (lines[k] === '}' || lines[k] === '};')
				return k;
		}
		return startIdx;
	}

	const defRanges = new Map(); // jsId -> {start, end}
	for (const [jsId] of exportMap) {
		if (aliasIds.has(jsId))
			continue;
		for (let j = 0; j < lines.length; j++) {
			const ln = lines[j];
			if (
				ln.startsWith(`function ${jsId}(`)
				|| ln.startsWith(`function ${jsId} (`)
				|| ln.startsWith(`const ${jsId} = `)
				|| ln.startsWith(`var ${jsId} = `)
			) {
				defRanges.set(jsId, { start: j, end: findDefEnd(j) });
				break;
			}
		}
	}

	// Step 4: build skip set
	const skipLines = new Set();

	function markBlock(startIdx, open, close) {
		let depth = 0;
		for (let k = startIdx; k < lines.length; k++) {
			for (const ch of lines[k]) {
				if (ch === open)
					depth++;
				else if (ch === close)
					depth--;
			}
			skipLines.add(k);
			if (depth === 0 && k > startIdx)
				break;
		}
	}

	for (let j = 0; j < lines.length; j++) {
		const ln = lines[j];
		if (/^const \w+ = \/\* @__PURE__ \*\/ Object\.freeze\(/.test(ln)) {
			markBlock(j, '(', ')');
			continue;
		}
		if (/^const (?:Conditionals|Predicates|Transformers|builtInFunctions|internalFunctions) = \{/.test(ln)) {
			markBlock(j, '{', '}');
			continue;
		}
		if (/^const ReservedInternalFunctionNames = \[/.test(ln)) {
			markBlock(j, '[', ']');
			continue;
		}
		const am = ln.match(/^const (\w+) = (\w+);$/);
		if (am && aliasIds.has(am[1]))
			skipLines.add(j);
	}

	const defLineSet = new Set();
	for (const [, { start, end }] of defRanges) {
		for (let k = start; k <= end; k++) defLineSet.add(k);
	}

	// Step 5: preamble = lines not in defLineSet and not in skipLines
	const preambleLines = [];
	for (let j = 0; j < lines.length; j++) {
		if (!skipLines.has(j) && !defLineSet.has(j))
			preambleLines.push(lines[j]);
	}
	while (preambleLines.length && preambleLines[preambleLines.length - 1].trim() === '')
		preambleLines.pop();

	// Step 6: emit marked blocks in original source order
	const sortedIds = [...defRanges.keys()].sort((a, b) => defRanges.get(a).start - defRanges.get(b).start);
	const blocks = sortedIds.map((jsId) => {
		const { start, end } = defRanges.get(jsId);
		const exportNames = exportMap.get(jsId);
		const blockName = exportNames[0];
		const defLines = lines.slice(start, end + 1).join('\n');
		const regs = exportNames.map(n => `builtInFunctions['${n}'] = ${jsId};`).join('\n');
		return `// @@begin: ${blockName}\n${defLines}\n${regs}\n// @@end: ${blockName}`;
	});

	return `${preambleLines.join('\n')}\n\nconst builtInFunctions = {};\n\n${blocks.join('\n')}`;
}

jsCode = addMarkersToBundle(jsCode);

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
		'',
		...[...importLines],
		'',
		...bodyLines,
	].join('\n');

	writeFileSync(pyDst, pyContent);
	console.log(`Python builtins written: ${pyDst}`);
}
