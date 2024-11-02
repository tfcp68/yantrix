export const buttonDefinitions = {
	primary: 'primary',
	danger: 'danger',
} as const;

const buttonDefinitionsToBackgrounds = {
	[buttonDefinitions.primary]: '#4Ca010',
	[buttonDefinitions.danger]: 'rgb(179, 41, 70)',
};

function Button(props: {
	definition?: keyof typeof buttonDefinitions;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
	const background
		= props.disabled
			? 'rgb(90,90,90)'
			: buttonDefinitionsToBackgrounds[props.definition || buttonDefinitions.primary];
	return (
		<button
			{...props}
			style={{
				padding: '10px 20px',
				background,
				borderRadius: '5px',
				border: 'none',
				fontSize: '14px',
				fontWeight: 'bold',
				color: 'white',
				cursor: 'pointer',
				...props.style,
			}}
		/>
	);
}

export default Button;
