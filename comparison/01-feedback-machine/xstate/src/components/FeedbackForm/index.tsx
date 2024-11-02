import { feedbackMachineStates } from '../../machine';
import { FeedbackMachineContext } from '../../providers/feedbackMachine';
import FeedbackForm from './FeedbackForm';
import FeedbackPrompt from './FeedbackPrompt';
import FeedbackThanks from './FeedbackThanks';

const stateToComponent: Partial<Record<keyof typeof feedbackMachineStates, React.ReactNode>> = {
	[feedbackMachineStates.prompt]: <FeedbackPrompt />,
	[feedbackMachineStates.thanks]: <FeedbackThanks />,
	[feedbackMachineStates.form]: <FeedbackForm />,
} as const;

function FeedbackProcess() {
	const state = FeedbackMachineContext.useSelector(state => state.value);

	return stateToComponent[state];
}

export default FeedbackProcess;
