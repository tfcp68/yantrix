/**
 * Machine-readable reason codes for structural errors.
 */
export type TStructuralErrorCode =
	| 'unsupported-arrow'
	| 'unsupported-construct'
	| 'mermaid-api-mismatch';

/**
 * Error thrown by the structural pass when the diagram uses mermaid
 * constructs outside the supported Yantrix subset, or when the pinned
 * mermaid version stops exposing the internals this parser relies on.
 */
export class SequenceStructuralError extends Error {
	constructor(
		public readonly code: TStructuralErrorCode,
		message: string,
		public readonly line: number = 0,
	) {
		super(line > 0 ? `[line ${line}] ${message}` : message);
		this.name = 'SequenceStructuralError';
	}
}
