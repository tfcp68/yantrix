import { coordinateKey, TGameModel, TPlayer } from '../domain/gameModel';
import { cameraFromBoardDrag } from './boardPan';

const BOARD_SIZE = 15;
const BOARD_RADIUS = Math.floor(BOARD_SIZE / 2);

type TMode = 'place' | 'nova';
type TActionHandlers = {
	place: (x: number, y: number) => void;
	nova: (x: number, y: number) => void;
	reset: () => void;
};

type TBoardPanGesture = {
	readonly pointerId: number;
	readonly startX: number;
	readonly startY: number;
	readonly cameraX: number;
	readonly cameraY: number;
	readonly boardWidth: number;
	readonly boardHeight: number;
};

function element<ElementType extends HTMLElement>(id: string): ElementType {
	const result = document.getElementById(id);
	if (!result) throw new Error(`Missing UI element #${id}`);
	return result as ElementType;
}

function playerName(player: TPlayer): string {
	return player === 'aurora' ? 'Aurora' : 'Umbra';
}

export class GameView {
	readonly #actions: TActionHandlers;
	readonly #board = element<HTMLDivElement>('board');
	readonly #unsubscribers: Array<() => void> = [];
	#mode: TMode = 'place';
	#cameraX = 0;
	#cameraY = 0;
	#lastModel: Readonly<TGameModel> | null = null;
	#boardPan: TBoardPanGesture | null = null;
	#commandChain = Promise.resolve();
	#resetTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(actions: TActionHandlers) {
		this.#actions = actions;
		this.#listen(element('placeMode'), 'click', () => this.#setMode('place'));
		this.#listen(element('novaMode'), 'click', () => this.#setMode('nova'));
		this.#listen(element('jumpTo'), 'click', () => {
			const x = Number(element<HTMLInputElement>('coordinateX').value);
			const y = Number(element<HTMLInputElement>('coordinateY').value);
			if (Number.isSafeInteger(x) && Number.isSafeInteger(y)) this.#setCamera(x, y);
		});
		this.#listen(element('resetGame'), 'click', () => this.#confirmReset());
		for (const button of document.querySelectorAll<HTMLButtonElement>('[data-pan]')) {
			this.#listen(button, 'click', () => {
				const [dx, dy] = (button.dataset.pan ?? '0,0').split(',').map(Number);
				if (dx === 0 && dy === 0) {
					const action = this.#lastModel?.lastAction;
					this.#setCamera(action?.x ?? 0, action?.y ?? 0);
				} else {
					this.#setCamera(this.#cameraX + dx * 3, this.#cameraY + dy * 3);
				}
			});
		}
		this.#listen(this.#board, 'wheel', (rawEvent) => {
			const event = rawEvent as WheelEvent;
			event.preventDefault();
			const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
			this.#setCamera(
				this.#cameraX + (horizontal ? Math.sign(event.deltaX) : 0),
				this.#cameraY + (horizontal ? 0 : Math.sign(event.deltaY)),
			);
		}, { passive: false });
		this.#listen(this.#board, 'pointerdown', (rawEvent) => {
			const event = rawEvent as PointerEvent;
			if (event.button !== 1) return;
			event.preventDefault();
			const bounds = this.#board.getBoundingClientRect();
			this.#boardPan = {
				pointerId: event.pointerId,
				startX: event.clientX,
				startY: event.clientY,
				cameraX: this.#cameraX,
				cameraY: this.#cameraY,
				boardWidth: bounds.width,
				boardHeight: bounds.height,
			};
			this.#board.setPointerCapture(event.pointerId);
			this.#board.classList.add('dragging');
		});
		this.#listen(this.#board, 'pointermove', (rawEvent) => {
			const event = rawEvent as PointerEvent;
			const gesture = this.#boardPan;
			if (!gesture || gesture.pointerId !== event.pointerId) return;
			if ((event.buttons & 4) === 0) {
				this.#finishBoardPan(event.pointerId);
				return;
			}
			event.preventDefault();
			const camera = cameraFromBoardDrag({
				...gesture,
				currentX: event.clientX,
				currentY: event.clientY,
				columns: BOARD_SIZE,
				rows: BOARD_SIZE,
			});
			if (camera.x !== this.#cameraX || camera.y !== this.#cameraY) {
				this.#setCamera(camera.x, camera.y);
			}
		});
		for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
			this.#listen(this.#board, eventName, (rawEvent) => {
				const event = rawEvent as PointerEvent;
				if (this.#boardPan?.pointerId !== event.pointerId) return;
				if (eventName === 'pointerup') event.preventDefault();
				this.#finishBoardPan(event.pointerId);
			});
		}
		this.#listen(this.#board, 'auxclick', (rawEvent) => {
			const event = rawEvent as MouseEvent;
			if (event.button === 1) event.preventDefault();
		});
		this.#listen(window, 'keydown', (rawEvent) => {
			const event = rawEvent as KeyboardEvent;
			if (!event.shiftKey) return;
			const delta: Record<string, [number, number]> = {
				ArrowUp: [0, -5],
				ArrowDown: [0, 5],
				ArrowLeft: [-5, 0],
				ArrowRight: [5, 0],
			};
			const movement = delta[event.key];
			if (!movement) return;
			event.preventDefault();
			this.#setCamera(this.#cameraX + movement[0], this.#cameraY + movement[1]);
		});
	}

	public render(model: Readonly<TGameModel>): void {
		this.#lastModel = model;
		element('auroraScore').textContent = String(model.scores.aurora);
		element('umbraScore').textContent = String(model.scores.umbra);
		element('auroraNova').textContent = String(model.nova.aurora);
		element('umbraNova').textContent = String(model.nova.umbra);
		element('turnNumber').textContent = String(model.turn);
		element('currentPlayer').textContent = `${playerName(model.currentPlayer)} moves`;
		element('gameNotice').textContent = model.notice;
		element('auroraCard').classList.toggle('active', model.currentPlayer === 'aurora');
		element('umbraCard').classList.toggle('active', model.currentPlayer === 'umbra');
		this.#renderBoard();
	}

	public reportStorageError(message: string): void {
		const errors = element('storageErrors');
		errors.hidden = false;
		errors.textContent = `Persistence warning: ${message}. The game remains playable.`;
	}

	public setRuntimeStatus(message: string, persistent: boolean): void {
		const status = element('runtimeStatus');
		status.textContent = message;
		status.classList.toggle('memory', !persistent);
	}

	public runCommand(command: () => Promise<void>): void {
		this.#commandChain = this.#commandChain.then(command).catch((error: unknown) => {
			element('gameNotice').textContent = error instanceof Error ? error.message : String(error);
		});
	}

	public dispose(): void {
		if (this.#resetTimer) clearTimeout(this.#resetTimer);
		this.#finishBoardPan();
		for (const unsubscribe of this.#unsubscribers.splice(0)) unsubscribe();
	}

	#finishBoardPan(pointerId?: number): void {
		const gesture = this.#boardPan;
		if (!gesture || (pointerId !== undefined && gesture.pointerId !== pointerId)) return;
		this.#boardPan = null;
		this.#board.classList.remove('dragging');
		if (this.#board.hasPointerCapture(gesture.pointerId)) {
			this.#board.releasePointerCapture(gesture.pointerId);
		}
	}

	#confirmReset(): void {
		const button = element<HTMLButtonElement>('resetGame');
		if (button.classList.contains('armed')) {
			if (this.#resetTimer) clearTimeout(this.#resetTimer);
			this.#resetTimer = null;
			button.classList.remove('armed');
			button.textContent = 'New universe';
			this.#actions.reset();
			return;
		}
		button.classList.add('armed');
		button.textContent = 'Click again to confirm';
		this.#resetTimer = setTimeout(() => {
			button.classList.remove('armed');
			button.textContent = 'New universe';
			this.#resetTimer = null;
		}, 2500);
	}

	#listen(
		target: EventTarget,
		type: string,
		listener: EventListener,
		options?: AddEventListenerOptions,
	): void {
		target.addEventListener(type, listener, options);
		this.#unsubscribers.push(() => target.removeEventListener(type, listener, options));
	}

	#setMode(mode: TMode): void {
		this.#mode = mode;
		element('placeMode').classList.toggle('active', mode === 'place');
		element('novaMode').classList.toggle('active', mode === 'nova');
		this.#board.classList.toggle('nova-mode', mode === 'nova');
	}

	#setCamera(x: number, y: number): void {
		if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) return;
		this.#cameraX = x;
		this.#cameraY = y;
		element<HTMLInputElement>('coordinateX').value = String(x);
		element<HTMLInputElement>('coordinateY').value = String(y);
		element('cameraPosition').textContent = `${x}:${y}`;
		this.#renderBoard();
	}

	#renderBoard(): void {
		if (!this.#lastModel) return;
		const fragment = document.createDocumentFragment();
		for (let offsetY = -BOARD_RADIUS; offsetY <= BOARD_RADIUS; offsetY++) {
			for (let offsetX = -BOARD_RADIUS; offsetX <= BOARD_RADIUS; offsetX++) {
				const x = this.#cameraX + offsetX;
				const y = this.#cameraY + offsetY;
				const player = this.#lastModel.board[coordinateKey(x, y)];
				const cell = document.createElement('button');
				cell.type = 'button';
				cell.className = `cell${player ? ` ${player}` : ''}${x === 0 && y === 0 ? ' origin' : ''}`;
				cell.role = 'gridcell';
				cell.title = `${x}:${y}${player ? ` · ${playerName(player)}` : ''}`;
				cell.setAttribute('aria-label', cell.title);
				if (player) {
					const star = document.createElement('span');
					star.className = 'star';
					star.textContent = player === 'aurora' ? '✦' : '◆';
					cell.append(star);
				}
				cell.addEventListener('click', () => {
					if (this.#mode === 'place') this.#actions.place(x, y);
					else this.#actions.nova(x, y);
				});
				fragment.append(cell);
			}
		}
		this.#board.replaceChildren(fragment);
	}
}
