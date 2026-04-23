import { useFSM } from '@yantrix/react';
import Button from './components/Button';
import FeedbackProcess from './components/FeedbackForm';
import { feedbackMachineActions, FeedbackMachineAutomata, feedbackMachineStates } from './machine';

function App() {
	const { state, dispatch, getState, getAction } = useFSM(FeedbackMachineAutomata);

	return (
		<div style={{
			width: '100%',
			height: '100vh',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			background: 'radial-gradient(circle, rgb(25, 25, 30), rgb(10, 10, 11))',
		}}
		>
			{state === getState(feedbackMachineStates.closed)
			&& (
				<Button
					onClick={() => {
						dispatch({ action: getAction(feedbackMachineActions.restart), payload: { feedback: '' } });
					}}
				>
					Provide feedback
				</Button>
			)}
			{state !== getState(feedbackMachineStates.closed) && <FeedbackProcess />}
		</div>
	);
}

export default App;
