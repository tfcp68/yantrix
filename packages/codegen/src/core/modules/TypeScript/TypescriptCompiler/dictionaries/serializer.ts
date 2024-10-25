import { JavaScriptCompiler } from '../../../JavaScript';

function getActionsMapType(props: {
	className?: string;
}) {
	return `export type TActions${props.className} = keyof typeof actionsMap;`;
}

export const dictionariesSerializer = {
	...JavaScriptCompiler.dictionaries.serializer,
	getActionsMapType,
} as const;
