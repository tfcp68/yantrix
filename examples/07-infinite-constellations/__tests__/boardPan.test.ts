import { describe, expect, it } from 'vitest';

import { cameraFromBoardDrag } from '../src/ui/boardPan';

describe('board middle-button pan geometry', () => {
	it('moves the camera opposite to the dragged board by whole visible cells', () => {
		expect(cameraFromBoardDrag({
			cameraX: 10,
			cameraY: -4,
			startX: 100,
			startY: 100,
			currentX: 140,
			currentY: 60,
			boardWidth: 600,
			boardHeight: 600,
			columns: 15,
			rows: 15,
		})).toEqual({ x: 9, y: -3 });
	});

	it('keeps sub-cell pointer movement stable until it crosses half a cell', () => {
		const gesture = {
			cameraX: 2,
			cameraY: 3,
			startX: 0,
			startY: 0,
			boardWidth: 450,
			boardHeight: 450,
			columns: 15,
			rows: 15,
		};

		expect(cameraFromBoardDrag({ ...gesture, currentX: 14, currentY: -14 }))
			.toEqual({ x: 2, y: 3 });
		expect(cameraFromBoardDrag({ ...gesture, currentX: 16, currentY: -16 }))
			.toEqual({ x: 1, y: 4 });
	});

	it('does not produce an invalid camera while the board has no layout size', () => {
		expect(cameraFromBoardDrag({
			cameraX: 7,
			cameraY: 8,
			startX: 0,
			startY: 0,
			currentX: 100,
			currentY: 100,
			boardWidth: 0,
			boardHeight: 0,
			columns: 15,
			rows: 15,
		})).toEqual({ x: 7, y: 8 });
	});
});
