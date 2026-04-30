import { TDefineExpressionModel } from '../expressions/functions';

export type TCustomRegistration =
	| { kind: 'inject'; name: string }
	| { kind: 'define'; name: string; args: string[]; bodyModel: TDefineExpressionModel };
