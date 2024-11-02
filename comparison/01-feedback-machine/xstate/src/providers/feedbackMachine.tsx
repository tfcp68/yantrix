import { createActorContext } from '@xstate/react';
import React from 'react';
import { feedbackMachine } from '../machine';

export const FeedbackMachineContext = createActorContext(feedbackMachine);

export const WithFeedbackMachine = (props: React.PropsWithChildren) => {
	return (
		<FeedbackMachineContext.Provider>
			{props.children}
		</FeedbackMachineContext.Provider>
	);
};
