import { BasicStateDictionary } from '@yantrix/automata';
import { hasByPass, hasInitialState } from '@yantrix/yantrix-parser';
import { TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';

export function getInitialState(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
}) {
	const stateWithInitial = props.diagram.states.find((state) => {
		return state.notes && hasInitialState(state.notes);
	});

	if (stateWithInitial) {
		return stateWithInitial.id;
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
	return stateInDiagram && stateInDiagram.notes && hasByPass(stateInDiagram.notes);
}
