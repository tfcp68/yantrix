import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterAll, expect, it } from 'vitest';

const cli = fileURLToPath(new URL('../bin/index.js', import.meta.url));
const directory = mkdtempSync(join(tmpdir(), 'yantrix-cli-order-'));
afterAll(() => rmSync(directory, { recursive: true, force: true }));

function generate(order?: string) {
	const output = join(directory, `${order ?? 'default'}.mjs`);
	const args = ['codegen', '--eval', 'stateDiagram-v2\n[*] --> Ready: Reset', '--language', 'pure-javascript', '--outfile', output];
	if (order !== undefined) args.push('--eventBusOrder', order);
	const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
	return { output, result };
}

it.each([
	[undefined, [1, 2]],
	['fifo', [1, 2]],
	['lifo', [2, 1]],
] as const)('generates a bus with the selected order (%s)', async (order, expected) => {
	const { output, result } = generate(order);
	expect(result.status, result.stderr + result.stdout).toBe(0);
	const { createEventBus } = await import(pathToFileURL(output).href);
	const [bus] = createEventBus('test', {});
	bus.dispatch({ event: 1, meta: null }, { event: 2, meta: null });
	expect(bus.getEventStack().map(({ event }: { event: number }) => event)).toEqual(expected);
});

it('rejects an invalid event bus order before writing the generated file', () => {
	const { output, result } = generate('random');
	expect(result.status).toBe(1);
	expect(result.stderr).toContain('fifo');
	expect(result.stderr).toContain('lifo');
	expect(existsSync(output)).toBe(false);
});
