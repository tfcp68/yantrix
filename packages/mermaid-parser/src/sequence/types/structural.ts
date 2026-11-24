/**
 * Source location inside the diagram text. Lines are 1-based; 0 means unknown.
 */
export type TStructuralLocation = {
	line: number;
};

/**
 * Note placement relative to its participant(s);
 * https://mermaid.js.org/syntax/sequenceDiagram.html#notes
 */
export type TStructuralPlacement = 'leftOf' | 'rightOf' | 'over';

/**
 * Supported arrow kinds: `->>` (solid) and `-->>` (dotted).
 * All other mermaid arrow variants are rejected by the structural pass.
 */
export type TStructuralArrowKind = 'solid' | 'dotted';

/**
 * Activation effect of a message (`+`/`-` suffix on the arrow).
 */
export type TStructuralActivation = 'none' | 'activate' | 'deactivate';

/**
 * Supported block kinds;
 * https://mermaid.js.org/syntax/sequenceDiagram.html#loops
 */
export type TStructuralBlockKind = 'alt' | 'opt' | 'loop' | 'par';

/**
 * A participant of the sequence diagram.
 */
export type TStructuralParticipant = {
	/** Mermaid identifier (the name used in arrows). */
	name: string;
	/** Display alias from `participant X as ...`, null when it matches the name. */
	alias: string | null;
	/** True when declared with the `actor` keyword. */
	isActor: boolean;
	/** True when declared with a `participant`/`actor` line, false when implied by an arrow. */
	declared: boolean;
	location: TStructuralLocation;
};

/**
 * A directed arrow between two participants.
 */
export type TStructuralMessage = {
	from: string;
	to: string;
	/** Free-form arrow label (text after `:`). */
	label: string;
	arrow: TStructuralArrowKind;
	activation: TStructuralActivation;
	/** Index into the notes array of the note attached to this arrow, if any. */
	noteIndex: number | null;
	/** Path of enclosing block branches, e.g. ['alt:success', 'loop:retry']. */
	blockPath: string[];
	location: TStructuralLocation;
};

/**
 * A note; the text is opaque at this level (parsed later by yantrix-parser).
 */
export type TStructuralNote = {
	placement: TStructuralPlacement;
	first: string;
	/** Second participant of `note over A, B`, null otherwise. */
	second: string | null;
	text: string;
	/** Index into the messages array of the arrow this note is attached to, if any. */
	messageIndex: number | null;
	location: TStructuralLocation;
};

/**
 * One branch of a block: the implicit first branch, an `else` or an `and` branch.
 */
export type TStructuralBlockBranch = {
	label: string | null;
	/** Indices into the flat messages array (direct children only). */
	messageIndices: number[];
	/** Nested blocks (direct children only). */
	blocks: TStructuralBlock[];
};

/**
 * A grouping block (`alt`/`opt`/`loop`/`par`) with one or more branches.
 */
export type TStructuralBlock = {
	kind: TStructuralBlockKind;
	branches: TStructuralBlockBranch[];
	location: TStructuralLocation;
};

/**
 * Result of the structural pass: raw mermaid sequence diagram structure.
 * Note text is NOT interpreted here; Yantrix subsyntax parsing and all
 * event semantics live in `@yantrix/yantrix-parser`.
 */
export type TSequenceStructuralDiagram = {
	participants: TStructuralParticipant[];
	messages: TStructuralMessage[];
	notes: TStructuralNote[];
	/** Top-level blocks; nested blocks live inside their parent branch. */
	blocks: TStructuralBlock[];
};
