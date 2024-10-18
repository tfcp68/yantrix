import { TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';

export function getInitialState(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
}) {
	const hasInitial = props.diagram.states.find((state) => {
		return Boolean(state.notes?.initialState);
	});

	if (hasInitial) {
		return hasInitial.id;
	}

	const firstState = props.diagram.states[0]?.id;

	if (!firstState) {
		throw new Error('Invalid state');
	}

	return firstState;
}
