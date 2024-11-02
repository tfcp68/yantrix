import React from 'react';

function FormBody(props: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			style={{
				width: '450px',
				background: '#f1f1f1',
				borderRadius: '10px',
				padding: '15px',
			}}
		>
			{props.children}
		</div>
	);
}

export default FormBody;
