import { useFSM } from '@yantrix/react';
import { feedbackMachineActions, FeedbackMachineAutomata } from '../../machine';
import Button from '../Button';
import FormBody from '../FormBody';
import FormHeader from '../FormHeader';

function FeedbackPrompt() {
	const { dispatch, getAction } = useFSM(FeedbackMachineAutomata);

	return (
		<FormBody>
			<FormHeader onClick={() => {
				dispatch({ action: getAction(feedbackMachineActions.close), payload: {} });
			}}
			/>
			<h2>How was your experience?</h2>
			<div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
				<Button onClick={() => {
					dispatch({ action: getAction(feedbackMachineActions.good), payload: {} });
				}}
				>
					Good
				</Button>
				<Button
					definition="danger"
					onClick={() => {
						dispatch({ action: getAction(feedbackMachineActions.bad), payload: {} });
					}}
				>
					Bad
				</Button>
			</div>
		</FormBody>
	);
}

export default FeedbackPrompt;
