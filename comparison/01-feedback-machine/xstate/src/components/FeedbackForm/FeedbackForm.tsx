import { feedbackMachineEvents } from '../../machine';
import { FeedbackMachineContext } from '../../providers/feedbackMachine';
import Button from '../Button';
import FormBody from '../FormBody';
import FormHeader from '../FormHeader';

function FeedbackForm() {
	const feedbackMachineActorRef = FeedbackMachineContext.useActorRef();
	const canSubmit = FeedbackMachineContext.useSelector(state => state.can({ type: feedbackMachineEvents.submit }));

	return (
		<FormBody>
			<FormHeader onClick={() => {
				feedbackMachineActorRef.send({ type: feedbackMachineEvents.close });
			}}
			/>
			<h2>
				What we can do better?
			</h2>

			<textarea
				style={{
					marginTop: '15px',
					width: '100%',
					resize: 'none',
					height: '70px',
					outline: 'none',
				}}
				onChange={(e) => {
					feedbackMachineActorRef.send({
						type: feedbackMachineEvents['feedback.update'],
						value: e.target.value,
					});
				}}
			/>
			<Button
				disabled={!canSubmit}
				style={{
					display: 'block',
					marginTop: '10px',
				}}
				onClick={() => {
					feedbackMachineActorRef.send({ type: feedbackMachineEvents.submit });
				}}
			>
				Submit
			</Button>

		</FormBody>
	);
}

export default FeedbackForm;
