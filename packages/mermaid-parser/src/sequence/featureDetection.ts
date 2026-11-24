import mermaid from 'mermaid';
import { SequenceStructuralError } from './errors/structuralError.js';

/**
 * One raw entry of mermaid's sequence db (`getMessages()`): an arrow, a note,
 * a block marker or an activation. `from`/`to` are absent on block markers;
 * `type` is a numeric LINETYPE code decoded by the structural pass.
 */
export type TMermaidDbEntry = {
	from?: string;
	to?: string;
	message: string;
	type: number;
	activate?: boolean;
	placement?: number;
};

/** The subset of a mermaid actor the structural pass reads. */
export type TMermaidActor = {
	name: string;
	description: string;
	type: string;
};

/**
 * The subset of mermaid's sequence `diagram.db` the structural pass depends on.
 * mermaid types `db` as the generic `DiagramDB`, which does not expose these
 * sequence-specific methods; {@link assertSequenceDbCompatible} narrows to this
 * shape at the single boundary, so the rest of the code stays cast-free.
 */
export interface IMermaidSequenceDb {
	getMessages: () => TMermaidDbEntry[];
	getActors: () => Map<string, TMermaidActor>;
	getCreatedActors: () => Map<string, unknown>;
}

const REQUIRED_DB_METHODS = ['getMessages', 'getActors', 'getCreatedActors'] as const;

/**
 * Assert that the mermaid API surface used by the structural pass exists.
 * The structural pass relies on undocumented internals of the pinned mermaid
 * version (diagram.db methods, numeric LINETYPE codes); this check surfaces
 * API drift early with a clear message instead of a runtime crash.
 */
export function assertMermaidCompatible(): void {
	if (typeof mermaid.mermaidAPI !== 'object' || mermaid.mermaidAPI === null) {
		throw new SequenceStructuralError(
			'mermaid-api-mismatch',
			'mermaid.mermaidAPI is not available; the pinned mermaid version is incompatible',
		);
	}
	if (typeof mermaid.mermaidAPI.getDiagramFromText !== 'function') {
		throw new SequenceStructuralError(
			'mermaid-api-mismatch',
			'mermaid.mermaidAPI.getDiagramFromText is not a function; the pinned mermaid version is incompatible',
		);
	}
}

/**
 * Narrow the parsed diagram's `db` to the sequence shape the structural pass
 * reads, or throw if the pinned mermaid version stopped exposing a method.
 */
export function assertSequenceDbCompatible(db: unknown): asserts db is IMermaidSequenceDb {
	if (typeof db !== 'object' || db === null) {
		throw new SequenceStructuralError(
			'mermaid-api-mismatch',
			'diagram.db is not an object; the pinned mermaid version is incompatible',
		);
	}
	for (const method of REQUIRED_DB_METHODS) {
		if (typeof Reflect.get(db, method) !== 'function') {
			throw new SequenceStructuralError(
				'mermaid-api-mismatch',
				`diagram.db.${method} is not a function; the pinned mermaid version is incompatible`,
			);
		}
	}
}
