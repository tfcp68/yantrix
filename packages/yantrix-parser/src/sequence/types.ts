import { SequenceNoteStatement } from '../generated/ast.js';

/**
 * Source location inside the diagram text. Lines are 1-based; 0 means unknown.
 */
export type TSourceLocation = {
	/** One-based source line, or zero when unavailable. */
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

/** A named participant and the role used to classify its messages. */
export interface ISequenceParticipant {
	/** Role derived from the participant declaration. */
	kind: TParticipantKind;
	/** Mermaid identifier (the name used in arrows). */
	name: string;
	/** Alias without the role prefix; falls back to the name. */
	displayName: string;
	/** True when declared with a `participant` line, false when implied by an arrow. */
	declared: boolean;
	/** Source position of the participant. */
	location: TSourceLocation;
}

/** A Mermaid note with its referenced participants and parsed Yantrix statements. */
export interface ISequenceNote {
	/** Where Mermaid displays the note relative to its participants. */
	placement: 'leftOf' | 'rightOf' | 'over';
	/** Name of the first participant referenced by the note. */
	first: string;
	/** Second participant for a note spanning two participants. */
	second: string | null;
	/** Raw note text (after `<br/>` to newline normalization). */
	text: string;
	/** Parsed Yantrix subsyntax statements; empty when the note failed to parse. */
	statements: SequenceNoteStatement[];
	/** Source position of the note. */
	location: TSourceLocation;
}

/** One arrow in diagram order, including its event and any attached note. */
export interface ISequenceMessage {
	/** Name of the sending participant. */
	from: string;
	/** Name of the receiving participant. */
	to: string;
	/** Free-form arrow label (also the event-name shortcut when it is an identifier). */
	label: string;
	/** Solid or dotted Mermaid arrow style. */
	arrowKind: 'solid' | 'dotted';
	/** Event wiring inferred from the roles of the sender and receiver. */
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
	/** Note linked to this arrow, or null if none matches. */
	attachedNote: ISequenceNote | null;
	/** Path of enclosing block branches, e.g. ['alt:success']. */
	blockPath: string[];
	/** Source position of the arrow. */
	location: TSourceLocation;
}

/** One arm of a block, with its directly enclosed messages and nested blocks. */
export interface ISequenceBlockBranch {
	/** Mermaid branch label, or null for an unlabeled arm. */
	label: string | null;
	/** Indices into the AST messages array (direct children only). */
	messages: number[];
	/** Blocks immediately nested within this arm. */
	blocks: ISequenceBlock[];
}

/** An alt, opt, loop or par block grouping related messages. */
export interface ISequenceBlock {
	/** Mermaid control keyword that opens this block. */
	kind: 'alt' | 'opt' | 'loop' | 'par';
	/** Arms in the order in which they appear in the diagram. */
	branches: ISequenceBlockBranch[];
	/** Source position of the opening keyword. */
	location: TSourceLocation;
}

/**
 * Semantic AST of a Yantrix sequence diagram: the contract between
 * Sources, Destinations and the EventBus.
 */
export interface ISequenceContractAST {
	/** Declared participants and participants introduced by an arrow. */
	participants: ISequenceParticipant[];
	/** All arrows in source order, including those inside blocks. */
	messages: ISequenceMessage[];
	/** Top-level blocks; nested blocks live inside their parent branch. */
	blocks: ISequenceBlock[];
	/** Notes not attached to any arrow; documentation, but define/inject statements still apply. */
	looseNotes: ISequenceNote[];
	/** Event bus name and whether the diagram explicitly declares it. */
	eventBus: {
		declared: boolean;
		name: string | null;
	};
}

/** Additional events to consider when checking subscriptions in a sequence diagram. */
export interface IParseSequenceOptions {
	/** Externally known event names; suppresses `unknown-event` for subscriptions to them. */
	eventDictionary?: Record<string, unknown>;
}

/** Parsed sequence contract together with diagnostics from semantic validation. */
export interface IParseSequenceResult {
	/** Participants, arrows, blocks and notes found in the diagram. */
	ast: ISequenceContractAST;
	/** Errors and warnings associated with the parsed contract. */
	diagnostics: ISequenceDiagnostic[];
}

/** Code identifying a sequence validation rule. */
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

/** A validation finding and its source position in the sequence diagram. */
export interface ISequenceDiagnostic {
	/** Rule that produced the finding. */
	kind: TSequenceDiagnosticKind;
	/** Whether validation recorded an error or a warning. */
	severity: 'error' | 'warning';
	/** Explanation of the finding. */
	message: string;
	/** Participant name for a finding about a participant. */
	participant?: string;
	/** Event name for a finding about a specific event. */
	eventName?: string;
	/** Source position associated with the finding. */
	location: TSourceLocation;
}
