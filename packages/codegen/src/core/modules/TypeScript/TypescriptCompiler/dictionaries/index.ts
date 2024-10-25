import { JavaScriptCompiler } from '../../../JavaScript';
import { dictionariesSerializer } from './serializer';

export const dictionaries = {
	serializer: dictionariesSerializer,
	functions: JavaScriptCompiler.dictionaries.functions,
};
