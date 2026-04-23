import { useFSM } from '@yantrix/react';
import { feedbackMachineActions, FeedbackMachineAutomata } from '../../machine';
import Button from '../Button';
import FormBody from '../FormBody';
import FormHeader from '../FormHeader';

function FeedbackForm() {
	const { dispatch, getAction, getContext } = useFSM(FeedbackMachineAutomata);
	const { context } = getContext();
	const canSubmit = context.feedback.length > 0;

	return (
		<FormBody>
			<FormHeader onClick={() => {
				dispatch({ action: getAction(feedbackMachineActions.close), payload: {} });
			}}
			/>
			<h2>What we can do better?</h2>
			<textarea
				style={{
					marginTop: '15px',
					width: '100%',
					resize: 'none',
					height: '70px',
					outline: 'none',
				}}
				value={context.feedback}
				onChange={(e) => {
					dispatch({
						action: getAction(feedbackMachineActions.update),
						payload: { value: e.target.value },
					});
				}}
			/>
			<Button
				disabled={!canSubmit}
				style={{ display: 'block', marginTop: '10px' }}
				onClick={() => {
					if (!canSubmit) return;
					dispatch({ action: getAction(feedbackMachineActions.submit), payload: {} });
				}}
			>
				Submit
			</Button>
		</FormBody>
	);
}

export default FeedbackForm;
