import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

// @ts-expect-error The bootstrap script is plain Node.js so it can run before TypeScript tooling is built.
import { ensureWorkspaceBuild, requiredWorkspaceEntrypoints } from '../scripts/ensureWorkspaceBuild.mjs';

describe('example workspace bootstrap', () => {
	it('requires the CLI, browser runtime and their transitive entrypoints', () => {
		expect(requiredWorkspaceEntrypoints('/repo')).toEqual([
			path.join('/repo', 'packages/automata/dist/index.js'),
			path.join('/repo', 'packages/cli/dist/index.js'),
			path.join('/repo', 'packages/codegen/dist/index.js'),
			path.join('/repo', 'packages/core/dist/index.js'),
			path.join('/repo', 'packages/functions/dist/index.js'),
			path.join('/repo', 'packages/mermaid-parser/dist/index.js'),
			path.join('/repo', 'packages/utils/dist/index.js'),
			path.join('/repo', 'packages/yantrix-parser/dist/index.js'),
		]);
	});

	it('builds the required workspace packages when an entrypoint is missing', () => {
		const runBuild = vi.fn(() => 0);

		expect(ensureWorkspaceBuild({
			workspaceRoot: '/repo',
			exists: (entrypoint: string) => !entrypoint.includes('packages/core'),
			runBuild,
		})).toBe(true);
		expect(runBuild).toHaveBeenCalledOnce();
	});

	it('skips the workspace build when all entrypoints already exist', () => {
		const runBuild = vi.fn(() => 0);

		expect(ensureWorkspaceBuild({
			workspaceRoot: '/repo',
			exists: () => true,
			runBuild,
		})).toBe(false);
		expect(runBuild).not.toHaveBeenCalled();
	});

	it('fails clearly when the dependency build fails', () => {
		expect(() => ensureWorkspaceBuild({
			workspaceRoot: '/repo',
			exists: () => false,
			runBuild: () => 2,
		})).toThrow('Failed to build Yantrix workspace dependencies');
	});
});
