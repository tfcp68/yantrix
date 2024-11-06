import { feedbackMachineEvents } from '../../machine';
import { FeedbackMachineContext } from '../../providers/feedbackMachine';
import Button from '../Button';
import FormBody from '../FormBody';
import FormHeader from '../FormHeader';

function FeedbackPrompt() {
	const feedbackMachineActorRef = FeedbackMachineContext.useActorRef();

	return (
		<FormBody>
			<FormHeader onClick={() => {
				feedbackMachineActorRef.send({ type: feedbackMachineEvents.close });
			}}
			/>
			<h2>
				How was your experience?
			</h2>
			<div
				style={{
					display: 'flex',
					gap: '15px',
					marginTop: '15px',
				}}
			>
				<Button onClick={() => {
					feedbackMachineActorRef.send({ type: feedbackMachineEvents['feedback.good'] });
				}}
				>
					Good
				</Button>
				<Button
					definition="danger"
					onClick={() => {
						feedbackMachineActorRef.send({ type: feedbackMachineEvents['feedback.bad'] });
					}}
				>
					Bad
				</Button>

			</div>

		</FormBody>
	);
}

export default FeedbackPrompt;
