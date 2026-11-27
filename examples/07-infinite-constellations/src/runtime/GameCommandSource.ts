import {
	createDataSourceAdapter,
	NamedDataSource,
} from '@yantrix/core';

import { eventDictionary } from '../generated/InfiniteConstellations';

type TGameCommand =
	| { kind: 'place'; x: number; y: number }
	| { kind: 'nova'; x: number; y: number }
	| { kind: 'reset' };

const GameCommandSourceBase = createDataSourceAdapter<
	number,
	Record<number, unknown>,
	TGameCommand
>()(NamedDataSource<TGameCommand>);

/** A real CoreLoop Source shared by the browser UI and deterministic tests. */
export class GameCommandSource extends GameCommandSourceBase {
	constructor(id = 'infinite-constellations-commands') {
		super({ id });
		this.addListener('commands', (command) => {
			switch (command.kind) {
				case 'place':
					return [{ event: eventDictionary.placeRequested, meta: { x: command.x, y: command.y } }];
				case 'nova':
					return [{ event: eventDictionary.novaRequested, meta: { x: command.x, y: command.y } }];
				case 'reset':
					return [{ event: eventDictionary.resetRequested, meta: {} }];
			}
		});
	}

	public place(x: number, y: number): void {
		this._addDataPacket({ kind: 'place', x, y });
	}

	public nova(x: number, y: number): void {
		this._addDataPacket({ kind: 'nova', x, y });
	}

	public reset(): void {
		this._addDataPacket({ kind: 'reset' });
	}
}
