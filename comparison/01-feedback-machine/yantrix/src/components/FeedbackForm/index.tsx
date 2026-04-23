import { useFSM } from '@yantrix/react';
import { FeedbackMachineAutomata, feedbackMachineStates } from '../../machine';
import FeedbackForm from './FeedbackForm';
import FeedbackPrompt from './FeedbackPrompt';
import FeedbackThanks from './FeedbackThanks';

type TStateName = typeof feedbackMachineStates[keyof typeof feedbackMachineStates];

const stateToComponent: Partial<Record<TStateName, React.ReactNode>> = {
	[feedbackMachineStates.prompt]: <FeedbackPrompt />,
	[feedbackMachineStates.thanks]: <FeedbackThanks />,
	[feedbackMachineStates.form]: <FeedbackForm />,
} as const;

function FeedbackProcess() {
	const { state, getState } = useFSM(FeedbackMachineAutomata);
	const stateName = (Object.values(feedbackMachineStates) as TStateName[])
		.find(name => getState(name) === state);

	return (stateName ? stateToComponent[stateName] : null) ?? null;
}

export default FeedbackProcess;
