export type TBoardDrag = {
	readonly cameraX: number;
	readonly cameraY: number;
	readonly startX: number;
	readonly startY: number;
	readonly currentX: number;
	readonly currentY: number;
	readonly boardWidth: number;
	readonly boardHeight: number;
	readonly columns: number;
	readonly rows: number;
};

export function cameraFromBoardDrag(drag: TBoardDrag): { x: number; y: number } {
	if (drag.boardWidth <= 0 || drag.boardHeight <= 0 || drag.columns <= 0 || drag.rows <= 0) {
		return { x: drag.cameraX, y: drag.cameraY };
	}

	const cellWidth = drag.boardWidth / drag.columns;
	const cellHeight = drag.boardHeight / drag.rows;
	const draggedColumns = Math.round((drag.currentX - drag.startX) / cellWidth);
	const draggedRows = Math.round((drag.currentY - drag.startY) / cellHeight);

	return {
		x: drag.cameraX - draggedColumns,
		y: drag.cameraY - draggedRows,
	};
}
