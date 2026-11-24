import {
	parseSequenceStructural,
	TSequenceStructuralDiagram,
	TStructuralBlock,
	TStructuralNote,
} from '@yantrix/mermaid-parser';
import {
	isSequenceEmitStatement,
	isSequencePacketStatement,
	isSequenceSubscribeStatement,
	SequenceEmitStatement,
	SequenceNoteStatement,
	SequencePacketStatement,
	SequenceSubscribeStatement,
} from '../generated/ast.js';
import { parseYantrixSequenceNote } from '../parser.js';
import {
	IParseSequenceOptions,
	IParseSequenceResult,
	ISequenceBlock,
	ISequenceContractAST,
	ISequenceDiagnostic,
	ISequenceMessage,
	ISequenceNote,
	ISequenceParticipant,
	TMessageTopology,
	TParticipantKind,
	TSequenceDiagnosticKind,
	TSourceLocation,
} from './types.js';

const EVENT_NAME_PATTERN = /^[a-z]\w{0,254}$/i;
const EVENT_BUS_NAME = 'EventBus';

type TRoleKind = Extract<TParticipantKind, 'Source' | 'Destination'>;

/** Alias prefixes that assign a role: `participant UI as Source UI`. */
const ROLE_MATCHERS: ReadonlyArray<{ kind: TRoleKind; pattern: RegExp }> = [
	{ kind: 'Source', pattern: /^Source\s+(\S.*)$/ },
	{ kind: 'Destination', pattern: /^Destination\s+(\S.*)$/ },
];

// ── Predicates ──────────────────────────────────────────────────────────────

const isEventBus = (p: ISequenceParticipant): boolean => p.kind === 'EventBus';
const isSource = (p: ISequenceParticipant): boolean => p.kind === 'Source';
const isDestination = (p: ISequenceParticipant): boolean => p.kind === 'Destination';
const isIdentifier = (value: string): boolean => EVENT_NAME_PATTERN.test(value);

/** Wiring semantics of an arrow, derived purely from the endpoints' roles. */
function resolveTopology(from: ISequenceParticipant, to: ISequenceParticipant): TMessageTopology {
	if (isEventBus(to) && !isEventBus(from)) return 'emit';
	if (isEventBus(from) && !isEventBus(to)) return 'subscribe';
	if (isSource(from) && isDestination(to)) return 'direct';
	return 'descriptive';
}

// ── Diagnostics ─────────────────────────────────────────────────────────────

type TDiagnosticExtra = Partial<Pick<ISequenceDiagnostic, 'participant' | 'eventName'>>;

/** Accumulates diagnostics, factoring out the repeated `severity`/`location` shape. */
class DiagnosticSink {
	readonly items: ISequenceDiagnostic[] = [];

	error(
		kind: TSequenceDiagnosticKind,
		message: string,
		location: TSourceLocation,
		extra: TDiagnosticExtra = {},
	): void {
		this.items.push({ kind, severity: 'error', message, location, ...extra });
	}

	warning(
		kind: TSequenceDiagnosticKind,
		message: string,
		location: TSourceLocation,
		extra: TDiagnosticExtra = {},
	): void {
		this.items.push({ kind, severity: 'warning', message, location, ...extra });
	}
}

// ── Note statements ─────────────────────────────────────────────────────────

type TPartitionedStatements = {
	emits: SequenceEmitStatement[];
	subscribes: SequenceSubscribeStatement[];
	reducers: SequencePacketStatement[];
};

function partitionNoteStatements(statements: SequenceNoteStatement[]): TPartitionedStatements {
	return {
		emits: statements.filter(isSequenceEmitStatement),
		subscribes: statements.filter(isSequenceSubscribeStatement),
		reducers: statements.filter(isSequencePacketStatement),
	};
}

// ── Small utilities ─────────────────────────────────────────────────────────

function stripQuotes(value: string): string {
	const match = /^"(.*)"$/.exec(value);
	return match ? match[1]! : value;
}

function normalizeNoteText(text: string): string {
	return text.replace(/<br\s*\/?>/gi, '\n');
}

function matchRole(alias: string): { kind: TRoleKind; displayName: string } | null {
	for (const { kind, pattern } of ROLE_MATCHERS) {
		const match = pattern.exec(alias);
		if (match) return { kind, displayName: match[1]! };
	}
	return null;
}

function classifyParticipant(name: string, alias: string | null): {
	kind: TParticipantKind;
	displayName: string;
	reservedNameMisused: boolean;
} {
	const cleanAlias = alias === null ? null : stripQuotes(alias);
	const role = cleanAlias === null ? null : matchRole(cleanAlias);

	if (name === EVENT_BUS_NAME) {
		return { kind: 'EventBus', displayName: EVENT_BUS_NAME, reservedNameMisused: role !== null };
	}
	if (role !== null) {
		return { kind: role.kind, displayName: role.displayName, reservedNameMisused: false };
	}
	return { kind: 'generic', displayName: cleanAlias ?? name, reservedNameMisused: false };
}

function mapBlocks(structuralBlocks: TStructuralBlock[]): ISequenceBlock[] {
	return structuralBlocks.map(block => ({
		kind: block.kind,
		branches: block.branches.map(branch => ({
			label: branch.label,
			messages: [...branch.messageIndices],
			blocks: mapBlocks(branch.blocks),
		})),
		location: { line: block.location.line },
	}));
}

// ── Entry point ─────────────────────────────────────────────────────────────

/**
 * Semantic pass over a mermaid sequence diagram: builds the Yantrix contract
 * AST on top of the structural pass from `@yantrix/mermaid-parser`.
 * @param diagramText - Mermaid sequence diagram source text
 * @param options - Optional externally known event dictionary
 * @returns The contract AST plus diagnostics
 */
export async function parseSequenceDiagram(
	diagramText: string,
	options: IParseSequenceOptions = {},
): Promise<IParseSequenceResult> {
	const structural = await parseSequenceStructural(diagramText);
	const sink = new DiagnosticSink();

	const participants = buildParticipants(structural, sink);
	const participantsByName = new Map(participants.map(p => [p.name, p]));
	const busParticipant = participants.find(isEventBus) ?? null;

	if (busParticipant && !busParticipant.declared) {
		sink.error(
			'event-bus-not-declared',
			`'${EVENT_BUS_NAME}' is used in arrows but never declared; add 'participant ${EVENT_BUS_NAME}'`,
			{ line: 0 },
			{ participant: EVENT_BUS_NAME },
		);
	}

	const notes: ISequenceNote[] = structural.notes.map(note => buildNote(note, sink));

	let directCounter = 0;
	const messages: ISequenceMessage[] = structural.messages.map((message) => {
		const from = participantsByName.get(message.from)!;
		const to = participantsByName.get(message.to)!;
		const attachedNote = message.noteIndex !== null ? notes[message.noteIndex]! : null;
		const statements = attachedNote?.statements ?? [];
		const partition = partitionNoteStatements(statements);
		const location: TSourceLocation = { line: message.location.line };

		const topology = resolveTopology(from, to);
		validateRoles(topology, from, to, sink, location);
		validateStatementPlacement(topology, to, partition, sink, attachedNote?.location ?? location);

		let eventName: string | null = null;
		let eventIsSynthetic = false;
		if (topology === 'direct') {
			eventName = `__direct__${message.from}__${message.to}__${directCounter++}`;
			eventIsSynthetic = true;
		} else if (topology === 'emit' || topology === 'subscribe') {
			eventName = resolveEventName(topology, message.label, partition, sink, location);
		}

		return {
			from: message.from,
			to: message.to,
			label: message.label,
			arrowKind: message.arrow,
			topology,
			eventName,
			eventIsSynthetic,
			statements,
			attachedNote,
			blockPath: [...message.blockPath],
			location,
		};
	});

	validateEventCoverage(messages, options, sink);

	const looseNotes = notes.filter((_, index) => structural.notes[index]!.messageIndex === null);

	const ast: ISequenceContractAST = {
		participants,
		messages,
		blocks: mapBlocks(structural.blocks),
		looseNotes,
		eventBus: {
			declared: busParticipant?.declared ?? false,
			name: busParticipant ? EVENT_BUS_NAME : null,
		},
	};

	return { ast, diagnostics: sink.items };
}

function buildParticipants(
	structural: TSequenceStructuralDiagram,
	sink: DiagnosticSink,
): ISequenceParticipant[] {
	return structural.participants.map((participant) => {
		const location: TSourceLocation = { line: participant.location.line };
		if (participant.isActor) {
			sink.error(
				'actor-not-supported',
				`'actor ${participant.name}' is not supported; model external interaction as a Source: 'participant ${participant.name} as Source ${participant.name}'`,
				location,
				{ participant: participant.name },
			);
		}

		const { kind, displayName, reservedNameMisused } = classifyParticipant(participant.name, participant.alias);
		if (reservedNameMisused) {
			sink.error(
				'reserved-participant-name',
				`'${EVENT_BUS_NAME}' is a reserved participant name and cannot carry a Source/Destination role`,
				location,
				{ participant: participant.name },
			);
		}

		return { kind, name: participant.name, displayName, declared: participant.declared, location };
	});
}

function buildNote(note: TStructuralNote, sink: DiagnosticSink): ISequenceNote {
	const text = normalizeNoteText(note.text);
	let statements: SequenceNoteStatement[] = [];
	try {
		statements = [...parseYantrixSequenceNote(text).statements];
	} catch (e) {
		sink.error(
			'syntax-error',
			`note is not valid Yantrix sequence subsyntax: ${e instanceof Error ? e.message : String(e)}`,
			{ line: note.location.line },
		);
	}
	return {
		placement: note.placement,
		first: note.first,
		second: note.second,
		text,
		statements,
		location: { line: note.location.line },
	};
}

function validateRoles(
	topology: TMessageTopology,
	from: ISequenceParticipant,
	to: ISequenceParticipant,
	sink: DiagnosticSink,
	location: TSourceLocation,
): void {
	if (topology === 'emit' && isDestination(from)) {
		sink.error(
			'role-violation',
			`Destination '${from.name}' cannot emit events; Destinations only receive`,
			location,
			{ participant: from.name },
		);
	}
	if (topology === 'subscribe' && isSource(to)) {
		sink.error(
			'role-violation',
			`Source '${to.name}' cannot subscribe to events; Sources only emit`,
			location,
			{ participant: to.name },
		);
	}
}

const DIRECT_STATEMENT_MESSAGE
	= 'direct Source->Destination arrows carry a hidden event; use a packet reducer (@{...} <= ...) instead of emit/subscribe';

function validateStatementPlacement(
	topology: TMessageTopology,
	to: ISequenceParticipant,
	partition: TPartitionedStatements,
	sink: DiagnosticSink,
	location: TSourceLocation,
): void {
	const { emits, subscribes, reducers } = partition;

	if (topology !== 'direct' && reducers.length > 0) {
		sink.error(
			'misplaced-packet-reducer',
			'packet reducers (@{...} <= ...) are only valid on direct Source->Destination arrows',
			location,
		);
	}

	switch (topology) {
		case 'emit': {
			if (subscribes.length > 0) {
				sink.error(
					'subscribe-on-emit-arrow',
					'subscribe/ statements are not valid on arrows INTO the EventBus; use emit/',
					location,
				);
			}
			break;
		}
		case 'subscribe': {
			if (emits.length > 0) {
				sink.error(
					'emit-on-subscribe-arrow',
					'emit/ statements are not valid on arrows OUT of the EventBus; use subscribe/',
					location,
				);
			}
			for (const statement of subscribes) {
				if (statement.actionName !== undefined && isDestination(to)) {
					sink.warning(
						'destination-subscribe-with-action',
						`action '${statement.actionName}' is meaningless for Destination '${to.name}'; automaton contracts belong to generic participants`,
						location,
						{ participant: to.name, eventName: statement.identifier },
					);
				}
			}
			break;
		}
		case 'direct': {
			if (emits.length > 0) sink.error('emit-without-bus', DIRECT_STATEMENT_MESSAGE, location);
			if (subscribes.length > 0) sink.error('subscribe-without-bus', DIRECT_STATEMENT_MESSAGE, location);
			if (reducers.length === 0) {
				sink.error(
					'missing-inline-reducer',
					'direct Source->Destination arrows require exactly one packet reducer (@{...} <= ...) in the attached note',
					location,
				);
			}
			if (reducers.length > 1) {
				sink.error(
					'multiple-inline-reducers',
					'direct Source->Destination arrows allow only one packet reducer per arrow',
					location,
				);
			}
			break;
		}
		case 'descriptive': {
			if (emits.length > 0) {
				sink.error('emit-without-bus', 'emit/ statements require an arrow into the EventBus', location);
			}
			if (subscribes.length > 0) {
				sink.error('subscribe-without-bus', 'subscribe/ statements require an arrow out of the EventBus', location);
			}
			break;
		}
	}
}

/**
 * Resolve the event name of a bus-crossing arrow: explicit statement names win;
 * otherwise an identifier-like label IS the event name; otherwise a diagnostic.
 * With several explicit statements the first name is returned (all of them
 * still participate in event-coverage bookkeeping via the statements array).
 */
function resolveEventName(
	topology: 'emit' | 'subscribe',
	label: string,
	partition: TPartitionedStatements,
	sink: DiagnosticSink,
	location: TSourceLocation,
): string | null {
	const explicitNames = (topology === 'emit' ? partition.emits : partition.subscribes).map(s => s.identifier);
	const trimmedLabel = label.trim();

	if (explicitNames.length > 0) {
		if (isIdentifier(trimmedLabel) && !explicitNames.includes(trimmedLabel)) {
			sink.warning(
				'label-event-mismatch',
				`arrow label '${trimmedLabel}' looks like an event name but differs from the declared '${explicitNames.join('\', \'')}'`,
				location,
				{ eventName: explicitNames[0] },
			);
		}
		return explicitNames[0]!;
	}

	if (isIdentifier(trimmedLabel)) {
		return trimmedLabel;
	}

	sink.error(
		'missing-event-name',
		topology === 'emit'
			? `cannot resolve the emitted event name: add 'emit/<name>' to the attached note or use an identifier as the arrow label`
			: `cannot resolve the subscribed event name: add 'subscribe/<name>' to the attached note or use an identifier as the arrow label`,
		location,
	);
	return null;
}

/** Event names carried by a message: explicit statement identifiers, else the resolved name. */
function messageEventNames(message: ISequenceMessage, explicit: Array<{ identifier: string }>): string[] {
	if (explicit.length > 0) return explicit.map(s => s.identifier);
	return message.eventName !== null ? [message.eventName] : [];
}

/**
 * Flag subscriptions to events that are neither emitted in the diagram nor
 * listed in the external event dictionary. A warning, not an error: automata
 * hidden behind the EventBus legitimately emit events that no Source does.
 */
function validateEventCoverage(
	messages: ISequenceMessage[],
	options: IParseSequenceOptions,
	sink: DiagnosticSink,
): void {
	const known = new Set<string>(Object.keys(options.eventDictionary ?? {}));
	for (const message of messages) {
		if (message.topology !== 'emit') continue;
		for (const name of messageEventNames(message, message.statements.filter(isSequenceEmitStatement))) {
			known.add(name);
		}
	}

	for (const message of messages) {
		if (message.topology !== 'subscribe') continue;
		for (const name of messageEventNames(message, message.statements.filter(isSequenceSubscribeStatement))) {
			if (!known.has(name)) {
				sink.warning(
					'unknown-event',
					`event '${name}' is not emitted in this diagram; expected if an automaton behind the EventBus emits it, otherwise check the name or pass it via options.eventDictionary`,
					message.location,
					{ eventName: name },
				);
			}
		}
	}
}
