'use client';
import { Card } from '@/components/ui/card';
import { useFSM } from '@yantrix/react';
import TLA from '../generated/checkbox_controller';

const checkboxesData = [
	{ id: 1, label: 'Example checkbox 1' },
	{ id: 2, label: 'Example checkbox 2' },
	{ id: 3, label: 'Example checkbox 3' },
];

export function Checkbox() {
	const { dispatch: dispatchAutomata, state } = useFSM<Record<number, boolean>>(TLA);

	const toggleCheckbox = (id: number) => {
		dispatchAutomata(TLA.createAction('TOGGLE', { id }));
	};

	const isChecked = (id: number) => TLA.getState(state)?.[id];

	return (
		<div className="flex flex-col items-center space-y-3">
			{checkboxesData.map(checkbox => (
				<div key={checkbox.id} className="relative">
					<Card className="w-38 border-none p-3 space-y-3">
						<label className="flex items-center space-x-2 text-white">
							<input
								type="checkbox"
								className="h-5 w-5 rounded"
								checked={isChecked(checkbox.id)}
								onChange={() => toggleCheckbox(checkbox.id)}
							/>
							<span>{checkbox.label}</span>
						</label>
					</Card>
				</div>
			))}
		</div>
	);
}
