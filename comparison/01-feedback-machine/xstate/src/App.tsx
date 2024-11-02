import Button from './components/Button';
import FeedbackProcess from './components/FeedbackForm';
import { feedbackMachineEvents, feedbackMachineStates } from './machine';
import { FeedbackMachineContext } from './providers/feedbackMachine';

function App() {
	const state = FeedbackMachineContext.useSelector(state => state.value);
	const feedbackMachineActorRef = FeedbackMachineContext.useActorRef();

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
			{state === feedbackMachineStates.closed
			&& (
				<Button
					onClick={() => {
						feedbackMachineActorRef.send({ type: feedbackMachineEvents.restart, value: '' });
					}}
				>
					Provide feedback
				</Button>
			)}
			{state !== feedbackMachineStates.closed && <FeedbackProcess />}
		</div>
	);
}

export default App;
