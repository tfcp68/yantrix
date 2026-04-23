import { useFSM } from '@yantrix/react';
import { feedbackMachineActions, FeedbackMachineAutomata } from '../../machine';
import FormBody from '../FormBody';
import FormHeader from '../FormHeader';

function FeedbackThanks() {
	const { dispatch, getAction, getContext } = useFSM(FeedbackMachineAutomata);
	const { context } = getContext();

	return (
		<FormBody>
			<FormHeader onClick={() => {
				dispatch({ action: getAction(feedbackMachineActions.close), payload: {} });
			}}
			/>
			<h2 style={{ marginTop: 10 }}>Thanks for your feedback!</h2>
			{context.feedback
			&& (
				<span style={{ marginTop: 10, display: 'block' }}>
					"
					{context.feedback}
					"
				</span>
			)}
		</FormBody>
	);
}

export default FeedbackThanks;
