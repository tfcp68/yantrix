import mermaid from 'mermaid';
import { BlankInputError, InvalidInputError } from './errors/sequenceErrors.js';
import { SequenceStructuralError } from './errors/structuralError.js';
import {
	assertMermaidCompatible,
	assertSequenceDbCompatible,
	IMermaidSequenceDb,
} from './featureDetection.js';
import {
	TSequenceStructuralDiagram,
	TStructuralBlock,
	TStructuralBlockBranch,
	TStructuralBlockKind,
	TStructuralMessage,
	TStructuralNote,
	TStructuralParticipant,
	TStructuralPlacement,
} from './types/structural.js';

/**
 * Numeric entry codes of mermaid's sequence db (`diagram.db.getMessages()`),
 * verified against the pinned mermaid version. These are undocumented
 * internals; featureDetection guards the API surface, and unknown codes
 * are rejected explicitly below.
 */
const LINETYPE = {
	SOLID: 0,
	DOTTED: 1,
	NOTE: 2,
	LOOP_START: 10,
	LOOP_END: 11,
	ALT_START: 12,
	ALT_ELSE: 13,
	ALT_END: 14,
	OPT_START: 15,
	OPT_END: 16,
	ACTIVE_START: 17,
	ACTIVE_END: 18,
	PAR_START: 19,
	PAR_AND: 20,
	PAR_END: 21,
	AUTONUMBER: 26,
} as const;

const UNSUPPORTED_ARROWS: Record<number, string> = {
	3: '-x',
	4: '--x',
	5: '->',
	6: '-->',
	24: '-)',
	25: '--)',
	33: '<<->>',
};

const UNSUPPORTED_BLOCKS: Record<number, string> = {
	22: 'rect',
	23: 'rect',
	27: 'critical',
	28: 'critical',
	29: 'critical',
	30: 'break',
	31: 'break',
	32: 'par over',
};

const PLACEMENTS: Record<number, TStructuralPlacement> = {
	0: 'leftOf',
	1: 'rightOf',
	2: 'over',
};

/**
 * Best-effort mapper from db entries (which carry no source positions)
 * to 1-based line numbers. Entries arrive in document order, so a single
 * forward cursor over the raw lines is sufficient.
 */
class LineLocator {
	private cursor = 0;

	constructor(private readonly lines: string[]) {}

	next(pattern: RegExp): number {
		for (let i = this.cursor; i < this.lines.length; i++) {
			if (pattern.test(this.lines[i]!)) {
				this.cursor = i + 1;
				return i + 1;
			}
		}
		return 0;
	}
}

const LINE_PATTERNS = {
	arrow: /^\s*(?!note\b)\S+\s*--?>>/i,
	note: /^\s*note\s/i,
	blockStart: (kind: TStructuralBlockKind) => new RegExp(`^\\s*${kind}\\b`, 'i'),
	branch: /^\s*(else|and)\b/i,
} as const;

function extractParticipants(
	db: Pick<IMermaidSequenceDb, 'getActors'>,
	lines: string[],
): TStructuralParticipant[] {
	const declarations = new Map<string, { line: number }>();
	for (let i = 0; i < lines.length; i++) {
		const match = /^\s*(?:participant|actor)\s+([A-Z]\w*)/i.exec(lines[i]!);
		if (match) {
			declarations.set(match[1]!, { line: i + 1 });
		}
	}

	const participants: TStructuralParticipant[] = [];
	for (const [name, actor] of db.getActors()) {
		const declaration = declarations.get(name) ?? null;
		participants.push({
			name,
			alias: actor.description !== name ? actor.description : null,
			isActor: actor.type === 'actor',
			declared: declaration !== null,
			location: { line: declaration?.line ?? 0 },
		});
	}
	return participants;
}

type TBlockFrame = {
	block: TStructuralBlock;
	branch: TStructuralBlockBranch;
	pathEntry: string;
};

function makeBranch(label: string | null): TStructuralBlockBranch {
	return { label, messageIndices: [], blocks: [] };
}

function pathEntryOf(kind: TStructuralBlockKind, label: string | null): string {
	return label !== null && label !== '' ? `${kind}:${label}` : kind;
}

/**
 * Structural pass over a mermaid sequence diagram. Extracts participants,
 * arrows, notes (as opaque text) and grouping blocks, and links each note
 * to the nearest FOLLOWING arrow whose endpoints are consistent with it.
 * Yantrix subsyntax inside notes is NOT interpreted here - that is the
 * semantic pass in `@yantrix/yantrix-parser`.
 *
 * @param diagramText - Mermaid sequence diagram source text
 * @returns The structural diagram: participants, messages, notes, blocks
 */
export async function parseSequenceStructural(diagramText: string): Promise<TSequenceStructuralDiagram> {
	if (diagramText.trim() === '') {
		throw new BlankInputError();
	}
	assertMermaidCompatible();

	let diagram: Awaited<ReturnType<typeof mermaid.mermaidAPI.getDiagramFromText>>;
	try {
		mermaid.mermaidAPI.setConfig({ ...mermaid.mermaidAPI.defaultConfig });
		await mermaid.mermaidAPI.initialize();
		diagram = await mermaid.mermaidAPI.getDiagramFromText(diagramText);
	} catch (e) {
		throw new InvalidInputError(e instanceof Error ? e.message : String(e));
	}

	assertSequenceDbCompatible(diagram.db);
	const db = diagram.db;

	if (db.getCreatedActors().size > 0) {
		throw new SequenceStructuralError(
			'unsupported-construct',
			'create/destroy participant is not supported in Yantrix sequence diagrams',
		);
	}

	const lines = diagramText.split('\n');
	const locator = new LineLocator(lines);
	const entries = db.getMessages();

	const participants = extractParticipants(db, lines);
	const messages: TStructuralMessage[] = [];
	const notes: TStructuralNote[] = [];
	const blocks: TStructuralBlock[] = [];
	const blockStack: TBlockFrame[] = [];
	const pendingNotes: number[] = [];

	const openBlock = (kind: TStructuralBlockKind, label: string | null, line: number) => {
		const branch = makeBranch(label);
		const block: TStructuralBlock = { kind, branches: [branch], location: { line } };
		const parent = blockStack[blockStack.length - 1];
		if (parent) {
			parent.branch.blocks.push(block);
		} else {
			blocks.push(block);
		}
		blockStack.push({ block, branch, pathEntry: pathEntryOf(kind, label) });
	};

	const openBranch = (kinds: TStructuralBlockKind[], label: string | null) => {
		const frame = blockStack[blockStack.length - 1];
		if (!frame || !kinds.includes(frame.block.kind)) {
			throw new SequenceStructuralError('unsupported-construct', 'unbalanced block branch marker');
		}
		frame.branch = makeBranch(label);
		frame.block.branches.push(frame.branch);
		frame.pathEntry = pathEntryOf(frame.block.kind, label);
	};

	const closeBlock = (kinds: TStructuralBlockKind[]) => {
		const frame = blockStack.pop();
		if (!frame || !kinds.includes(frame.block.kind)) {
			throw new SequenceStructuralError('unsupported-construct', 'unbalanced block end marker');
		}
	};

	const noteMatchesMessage = (note: TStructuralNote, message: TStructuralMessage): boolean =>
		note.second !== null
			? (note.first === message.from && note.second === message.to)
			|| (note.first === message.to && note.second === message.from)
			: note.first === message.from || note.first === message.to;

	const linkNoteForward = (messageIndex: number) => {
		const message = messages[messageIndex]!;
		for (let i = pendingNotes.length - 1; i >= 0; i--) {
			const noteIndex = pendingNotes[i]!;
			const note = notes[noteIndex]!;
			if (noteMatchesMessage(note, message)) {
				note.messageIndex = messageIndex;
				message.noteIndex = noteIndex;
				pendingNotes.splice(i, 1);
				return;
			}
		}
	};

	/**
	 * A note attaches BACKWARD to the immediately preceding arrow when the
	 * endpoints are consistent and that arrow has no note yet (the natural
	 * "arrow, then note" authoring order). Otherwise it waits for the next
	 * consistent arrow; unmatched notes stay loose. One note per arrow.
	 */
	const linkNoteBackward = (noteIndex: number): boolean => {
		const note = notes[noteIndex]!;
		const message = messages[messages.length - 1];
		if (message && message.noteIndex === null && noteMatchesMessage(note, message)) {
			note.messageIndex = messages.length - 1;
			message.noteIndex = noteIndex;
			return true;
		}
		return false;
	};

	for (const entry of entries) {
		switch (entry.type) {
			case LINETYPE.SOLID:
			case LINETYPE.DOTTED: {
				messages.push({
					from: entry.from!,
					to: entry.to!,
					label: entry.message,
					arrow: entry.type === LINETYPE.SOLID ? 'solid' : 'dotted',
					activation: entry.activate ? 'activate' : 'none',
					noteIndex: null,
					blockPath: blockStack.map(frame => frame.pathEntry),
					location: { line: locator.next(LINE_PATTERNS.arrow) },
				});
				const messageIndex = messages.length - 1;
				blockStack[blockStack.length - 1]?.branch.messageIndices.push(messageIndex);
				linkNoteForward(messageIndex);
				break;
			}
			case LINETYPE.NOTE: {
				const placement = PLACEMENTS[entry.placement ?? -1];
				if (!placement) {
					throw new SequenceStructuralError(
						'mermaid-api-mismatch',
						`unknown note placement code: ${entry.placement}`,
					);
				}
				notes.push({
					placement,
					first: entry.from!,
					second: entry.to !== entry.from ? entry.to! : null,
					text: entry.message,
					messageIndex: null,
					location: { line: locator.next(LINE_PATTERNS.note) },
				});
				if (!linkNoteBackward(notes.length - 1)) {
					pendingNotes.push(notes.length - 1);
				}
				break;
			}
			case LINETYPE.ACTIVE_START:
				break;
			case LINETYPE.ACTIVE_END: {
				const last = messages[messages.length - 1];
				if (last && last.activation === 'none') {
					last.activation = 'deactivate';
				}
				break;
			}
			case LINETYPE.LOOP_START:
				openBlock('loop', entry.message || null, locator.next(LINE_PATTERNS.blockStart('loop')));
				break;
			case LINETYPE.OPT_START:
				openBlock('opt', entry.message || null, locator.next(LINE_PATTERNS.blockStart('opt')));
				break;
			case LINETYPE.ALT_START:
				openBlock('alt', entry.message || null, locator.next(LINE_PATTERNS.blockStart('alt')));
				break;
			case LINETYPE.PAR_START:
				openBlock('par', entry.message || null, locator.next(LINE_PATTERNS.blockStart('par')));
				break;
			case LINETYPE.ALT_ELSE:
				locator.next(LINE_PATTERNS.branch);
				openBranch(['alt'], entry.message || null);
				break;
			case LINETYPE.PAR_AND:
				locator.next(LINE_PATTERNS.branch);
				openBranch(['par'], entry.message || null);
				break;
			case LINETYPE.LOOP_END:
				closeBlock(['loop']);
				break;
			case LINETYPE.OPT_END:
				closeBlock(['opt']);
				break;
			case LINETYPE.ALT_END:
				closeBlock(['alt']);
				break;
			case LINETYPE.PAR_END:
				closeBlock(['par']);
				break;
			case LINETYPE.AUTONUMBER:
				break;
			default: {
				const arrow = UNSUPPORTED_ARROWS[entry.type];
				if (arrow) {
					throw new SequenceStructuralError(
						'unsupported-arrow',
						`arrow '${arrow}' is not supported in Yantrix sequence diagrams; use '->>' or '-->>'`,
						locator.next(LINE_PATTERNS.arrow),
					);
				}
				const construct = UNSUPPORTED_BLOCKS[entry.type];
				throw new SequenceStructuralError(
					'unsupported-construct',
					construct
						? `'${construct}' blocks are not supported in Yantrix sequence diagrams`
						: `unknown mermaid entry code: ${entry.type}`,
				);
			}
		}
	}

	return { participants, messages, notes, blocks };
}
