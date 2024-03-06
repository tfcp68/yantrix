export const toUpperFirst = (str: string) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

export const toTypedObjectProps = <T extends {}>(obj: T, name: string) => {
	const typeName = `T${toUpperFirst(name)}`;
	const typeGuardName = `isValid${toUpperFirst(name)}`;
	const objectName = `${name}Obj`;
	const objectBody = JSON.stringify(obj, null, 2);

	return {
		typeName,
		typeGuardName,
		objectName,
		objectBody,
	};
};

export const toTypedObjectBlock = <T extends {}>(obj: T, name: string) => {
	const props = toTypedObjectProps(obj, name);

	return `const ${props.objectName} = ${props.objectBody}
		type ${props.typeName} = keyof typeof ${props.objectName}
		const ${props.typeGuardName} = (obj: any): obj is ${props.typeName} => {
			return Object.keys(${props.objectName}).includes(obj);
		}`;
};
