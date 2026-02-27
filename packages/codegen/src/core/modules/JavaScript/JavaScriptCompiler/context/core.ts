import { getContextStatements } from '@yantrix/yantrix-parser';
import { TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';

export function getInitialContextShape(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateName: string;
}) {
	const states = props.diagram.states.filter(state => state.id === props.stateName);

	if (states.length) {
		return states.reduce(
			(acc, curr) => {
				if (!curr.notes) return acc;
				const contextStatements = getContextStatements(curr.notes);
				contextStatements.forEach((ctx) => {
					ctx.items.forEach((item) => {
						acc[item.identifier] = null;
					});
				});
				return acc;
			},
			{} as Record<string, null>,
		);
	}

	return null;
};
