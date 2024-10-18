import { TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';

export function getInitialContextShape(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateName: string;
}) {
	const states = props.diagram.states.filter(state => state.id === props.stateName);

	if (states.length) {
		return states.reduce(
			(acc, curr) => {
				curr.notes?.contextDescription.forEach((el) => {
					el.context.forEach((el) => {
						acc[el.keyItem.identifier] = null;
					});
				});
				return acc;
			},
			{} as Record<string, null>,
		);
	}

	return null;
};
