import type { ITypedObject, ITypedObjectProps } from './types.js';

export const toUpperFirst = (str: string) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

export const toTypedObjectProps = <T>(object: T, objName: string) => {
	const typeName = `T${toUpperFirst(objName)}`;
	const typeGuardName = `isValid${toUpperFirst(objName)}`;
	const name = `${objName}Obj`;
	const body = JSON.stringify(object, null, 2);

	return {
		typeName,
		typeGuardName,
		name,
		body,
	} as ITypedObjectProps;
};

export const toTypedObject = <T>(obj: T, name: string) => {
	const props = toTypedObjectProps(obj, name);

	const codeBlock = `const ${props.name} = ${props.name}
		type ${props.typeName} = keyof typeof ${props.name}
		const ${props.typeGuardName} = (obj: any): obj is ${props.typeName} => {
			return Object.keys(${props.name}).includes(obj);
		}`;

	return {
		...props,
		codeBlock,
	} as ITypedObject;
};
