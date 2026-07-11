import { SequenceNoteStatement } from '../generated/ast.js';

/**
 * Source location inside the diagram text. Lines are 1-based; 0 means unknown.
 */
export type TSourceLocation = {
	line: number;
};

/**
 * Participant role. Derived from the alias prefix (`participant UI as Source UI`),
 * the reserved name `EventBus`, or `generic` otherwise.
 */
export type TParticipantKind = 'Source' | 'Destination' | 'EventBus' | 'generic';

/**
 * Wiring semantics of an arrow:
 * - `emit` - arrow INTO the EventBus: the source participant emits an event;
 * - `subscribe` - arrow OUT of the EventBus: the target participant subscribes;
 * - `direct` - Source directly to Destination: hidden synthetic event with an inline reducer;
 * - `descriptive` - no wiring semantics, documentation only.
 */
export type TMessageTopology = 'emit' | 'subscribe' | 'direct' | 'descriptive';

export interface ISequenceParticipant {
	kind: TParticipantKind;
	/** Mermaid identifier (the name used in arrows). */
	name: string;
	/** Alias without the role prefix; falls back to the name. */
	displayName: string;
	/** True when declared with a `participant` line, false when implied by an arrow. */
	declared: boolean;
	location: TSourceLocation;
}

export interface ISequenceNote {
	placement: 'leftOf' | 'rightOf' | 'over';
	first: string;
	second: string | null;
	/** Raw note text (after `<br/>` to newline normalization). */
	text: string;
	/** Parsed Yantrix subsyntax statements; empty when the note failed to parse. */
	statements: SequenceNoteStatement[];
	location: TSourceLocation;
}

export interface ISequenceMessage {
	from: string;
	to: string;
	/** Free-form arrow label (also the event-name shortcut when it is an identifier). */
	label: string;
	arrowKind: 'solid' | 'dotted';
	topology: TMessageTopology;
	/**
	 * Resolved event name: explicit from a note statement, the label shortcut,
	 * or a synthetic `__direct__From__To__n` name for direct delivery.
	 * Null for descriptive arrows and unresolvable wiring arrows.
	 */
	eventName: string | null;
	/** True for direct-delivery arrows: the event is hidden and not subscribable. */
	eventIsSynthetic: boolean;
	/** Statements of the attached note (same reference as attachedNote.statements). */
	statements: SequenceNoteStatement[];
	attachedNote: ISequenceNote | null;
	/** Path of enclosing block branches, e.g. ['alt:success']. */
	blockPath: string[];
	location: TSourceLocation;
}

export interface ISequenceBlockBranch {
	label: string | null;
	/** Indices into the AST messages array (direct children only). */
	messages: number[];
	blocks: ISequenceBlock[];
}

export interface ISequenceBlock {
	kind: 'alt' | 'opt' | 'loop' | 'par';
	branches: ISequenceBlockBranch[];
	location: TSourceLocation;
}

/**
 * Semantic AST of a Yantrix sequence diagram: the contract between
 * Sources, Destinations and the EventBus.
 */
export interface ISequenceContractAST {
	participants: ISequenceParticipant[];
	messages: ISequenceMessage[];
	/** Top-level blocks; nested blocks live inside their parent branch. */
	blocks: ISequenceBlock[];
	/** Notes not attached to any arrow; documentation, but define/inject statements still apply. */
	looseNotes: ISequenceNote[];
	eventBus: {
		declared: boolean;
		name: string | null;
	};
}

export interface IParseSequenceOptions {
	/** Externally known event names; suppresses `unknown-event` for subscriptions to them. */
	eventDictionary?: Record<string, unknown>;
}

export interface IParseSequenceResult {
	ast: ISequenceContractAST;
	diagnostics: ISequenceDiagnostic[];
}

export type TSequenceDiagnosticKind =
	| 'syntax-error'
	| 'actor-not-supported'
	| 'event-bus-not-declared'
	| 'reserved-participant-name'
	| 'role-violation'
	| 'missing-event-name'
	| 'label-event-mismatch'
	| 'emit-on-subscribe-arrow'
	| 'subscribe-on-emit-arrow'
	| 'emit-without-bus'
	| 'subscribe-without-bus'
	| 'misplaced-packet-reducer'
	| 'missing-inline-reducer'
	| 'multiple-inline-reducers'
	| 'destination-subscribe-with-action'
	| 'unknown-event';

export interface ISequenceDiagnostic {
	kind: TSequenceDiagnosticKind;
	severity: 'error' | 'warning';
	message: string;
	participant?: string;
	eventName?: string;
	location: TSourceLocation;
}
