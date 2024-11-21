import { feedbackMachineEvents } from '../../machine';
import { FeedbackMachineContext } from '../../providers/feedbackMachine';
import FormBody from '../FormBody';
import FormHeader from '../FormHeader';

function FeedbackThanksForm() {
	const feedback = FeedbackMachineContext.useSelector(state => state.context.feedback);
	const feedbackMachineActorRef = FeedbackMachineContext.useActorRef();

	return (
		<FormBody>
			<FormHeader
				onClick={() => {
					feedbackMachineActorRef.send({ type: feedbackMachineEvents.close });
				}}
			/>
			<h2 style={{
				marginTop: 10,
			}}
			>
				Thanks for your feedback!
			</h2>
			{feedback
			&& (
				<span style={{
					marginTop: 10,
					display: 'block',
				}}
				>
					"
					{feedback}
					"
				</span>
			)}

		</FormBody>
	);
}

export default FeedbackThanksForm;
