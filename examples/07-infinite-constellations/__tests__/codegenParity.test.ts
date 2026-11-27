import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import * as typescriptArtifact from '../src/generated/InfiniteConstellations';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('infinite Constellations codegen contract', () => {
	it('generates TypeScript and JavaScript Slice factories from the same diagram', () => {
		const typescript = fs.readFileSync(path.join(root, 'src/generated/InfiniteConstellations.ts'), 'utf8');
		const javascript = fs.readFileSync(path.join(root, 'src/generated/InfiniteConstellations.contract.js'), 'utf8');

		for (const source of [typescript, javascript]) {
			expect(source).toContain('createInfiniteConstellationsEffectMatrix');
			expect(source).toContain('createInfiniteConstellationsSlice');
			expect(source).toContain('eventDictionary["stonePlaced"]');
			expect(source).toContain('eventDictionary["novaCast"]');
			expect(source).toContain('eventDictionary["gameReset"]');
		}
	});

	it('loads both artifacts with equivalent Event and Effect Matrix contracts', async () => {
		// @ts-expect-error The JavaScript parity artifact is intentionally generated without declarations.
		const javascriptArtifact = await import('../src/generated/InfiniteConstellations.contract.js');
		const effects = {
			stonePlaced: (_event: unknown, model: object) => model,
			novaCast: (_event: unknown, model: object) => model,
			gameReset: (_event: unknown, model: object) => model,
		};

		expect(javascriptArtifact.eventDictionary).toEqual(typescriptArtifact.eventDictionary);
		expect(Object.keys(javascriptArtifact.createInfiniteConstellationsEffectMatrix(effects))).toEqual(
			Object.keys(typescriptArtifact.createInfiniteConstellationsEffectMatrix(effects)),
		);
		expect(Object.keys(javascriptArtifact.createInfiniteConstellationsSlice(effects).getMachines())).toEqual(
			Object.keys(typescriptArtifact.createInfiniteConstellationsSlice(effects).getMachines()),
		);
	});
});
