import { BasicStateDictionary } from '@yantrix/automata';
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

export function stateIsByPass(props: {
	stateDictionary: BasicStateDictionary;
	diagram: TStateDiagramMatrixIncludeNotes;
	stateId: number;
}) {
	const stateFromDict = props.stateDictionary.getStateKeys({ states: [props.stateId] })[0];
	const stateInDiagram = props.diagram.states.find(st => st.id === stateFromDict);
	return stateInDiagram && stateInDiagram.notes && stateInDiagram.notes.byPass === true;
}
