import { ValidationAcceptor, ValidationChecks, ValidationRegistry } from 'langium';
import { ContextStatement, SubscribeStatement, YantrixLanguageAstType } from '../generated/ast';
import { TDomainModelServices } from '../yantrix-module';

/**
 * Registry for validation checks for the Yantrix language
 */
export class YantrixLanguageValidationRegistry extends ValidationRegistry {
	constructor(services: TDomainModelServices) {
		super(services);
		const validator = services.validation.YantrixLanguageValidator;
		const checks: ValidationChecks<YantrixLanguageAstType> = {
			ContextStatement: validator.contextStatement,
			SubscribeStatement: validator.subscribeStatement,
		};

		this.register(checks, validator);
	}
}

export class YantrixLanguageValidator {
	contextStatement(statement: ContextStatement, accept: ValidationAcceptor): void {
		if (statement.reducerItems) {
			const leftLen = statement.keyItems.keyItemsRaw.length;
			if (leftLen < statement.reducerItems.keyItems.length) {
				accept('error', 'Context statement must have at least as many key items as reducer items', {
					node: statement,
				});
			}
		}
	}

	/**
	 * Validates that subscribe statements have an action name
	 */
	subscribeStatement(statement: SubscribeStatement, accept: ValidationAcceptor): void {
		if (!statement.actionName) {
			accept('error', 'Subscribe statement cannot have empty parentheses for payload items', {
				node: statement,
			});
		}
	}
}
