import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REQUIRED_WORKSPACE_PACKAGES = [
	'automata',
	'cli',
	'codegen',
	'core',
	'functions',
	'mermaid-parser',
	'utils',
	'yantrix-parser',
];

export function requiredWorkspaceEntrypoints(workspaceRoot) {
	return REQUIRED_WORKSPACE_PACKAGES.map(packageName => (
		path.join(workspaceRoot, `packages/${packageName}/dist/index.js`)
	));
}

export function ensureWorkspaceBuild({ workspaceRoot, exists, runBuild }) {
	const missing = requiredWorkspaceEntrypoints(workspaceRoot).filter(entrypoint => !exists(entrypoint));
	if (missing.length === 0)
		return false;

	console.log(`Preparing Yantrix workspace packages (${missing.length} missing entrypoint${missing.length === 1 ? '' : 's'})…`);
	if (runBuild() !== 0) {
		throw new Error('Failed to build Yantrix workspace dependencies');
	}
	return true;
}

const executedDirectly = process.argv[1]
	&& pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (executedDirectly) {
	const workspaceRoot = fileURLToPath(new URL('../../../', import.meta.url));
	const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
	try {
		ensureWorkspaceBuild({
			workspaceRoot,
			exists: existsSync,
			runBuild: () => spawnSync(pnpm, [
				'--workspace-root',
				'exec',
				'turbo',
				'run',
				'build',
				'--filter=@yantrix/cli',
				'--filter=@yantrix/core',
				'--output-logs=errors-only',
			], { cwd: workspaceRoot, stdio: 'inherit' }).status ?? 1,
		});
	}
	catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	}
}
