import React from 'react';

function FormHeader(props: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			{...props}
			style={{
				width: '100%',
				height: 30,
				display: 'flex',
				justifyContent: 'flex-end',
				...props.style,
			}}
			onClick={undefined}
		>
			<span
				onClick={props.onClick}
				style={{
					cursor: 'pointer',
				}}
			>
				close
			</span>
		</div>
	);
}

export default FormHeader;
