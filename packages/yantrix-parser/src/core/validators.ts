import { ValidationAcceptor, ValidationChecks } from 'langium';
import { DefineStatement, EmitStatement, InjectStatement, SubscribeStatement, YantrixLanguageAstType } from '../generated/ast';
import { TDomainModelServices } from '../yantrix-module';

/**
 * Register validation checks for the Yantrix language
 */
export function registerYantrixValidationChecks(services: TDomainModelServices) {
	const registry = services.validation.ValidationRegistry;
	const validator = services.validation.YantrixLanguageValidator;
	const checks: ValidationChecks<YantrixLanguageAstType> = {
		InjectStatement: validator.checkInjectIdentifier,
		DefineStatement: validator.checkDefineIdentifier,
		EmitStatement: validator.checkEmitIdentifier,
		SubscribeStatement: validator.checkSubscribeIdentifier,
	};

	registry.register(checks, validator);
}

/**
 * Implementation of Yantrix-specific validation checks.
 */
export class YantrixLanguageValidator {
	checkInjectIdentifier(statement: InjectStatement, accept: ValidationAcceptor): void {
		console.log(statement);
		if (!statement.identifier || statement.identifier.trim() === '') {
			accept('error', 'Inject statement requires a non-empty identifier', {
				node: statement,
				property: 'identifier',
			});
		}
	}

	checkDefineIdentifier(statement: DefineStatement, accept: ValidationAcceptor): void {
		console.log('defin');
		if (!statement.identifier || statement.identifier.trim() === '') {
			accept('error', 'Define statement requires a non-empty identifier', {
				node: statement,
				property: 'identifier',
			});
		}
	}

	checkEmitIdentifier(statement: EmitStatement, accept: ValidationAcceptor): void {
		if (!statement.identifier || statement.identifier.trim() === '') {
			accept('error', 'Emit statement requires a non-empty identifier', {
				node: statement,
				property: 'identifier',
			});
		}
	}

	checkSubscribeIdentifier(statement: SubscribeStatement, accept: ValidationAcceptor): void {
		if (!statement.eventIdentifier || statement.eventIdentifier.trim() === '') {
			accept('error', 'Subscribe statement requires a non-empty event identifier', {
				node: statement,
				property: 'eventIdentifier',
			});
		}

		if (!statement.actionName || statement.actionName.trim() === '') {
			accept('error', 'Subscribe statement requires a non-empty action name', {
				node: statement,
				property: 'actionName',
			});
		}
	}
}
