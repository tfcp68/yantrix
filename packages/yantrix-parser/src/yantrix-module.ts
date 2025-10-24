import { inject, Module } from 'langium';
import { createDefaultModule, createDefaultSharedModule, DefaultSharedModuleContext, LangiumServices, LangiumSharedServices, PartialLangiumServices } from 'langium/lsp';
import { YantrixLanguageValidationRegistry, YantrixLanguageValidator } from './core/validators.js';
import { YantrixLanguageGeneratedModule, YantrixLanguageGeneratedSharedModule } from './generated/module.js';

export type TYantrixServices = {
	validation: {
		YantrixLanguageValidator: YantrixLanguageValidator;
	};
};

export type TDomainModelServices = LangiumServices & TYantrixServices;

export const DomainModelModule: Module<TDomainModelServices, PartialLangiumServices & TYantrixServices> = {
	validation: {
		YantrixLanguageValidator: () => new YantrixLanguageValidator(),
		ValidationRegistry: service => new YantrixLanguageValidationRegistry(service),
	},

};

export function createYantrixServices(context: DefaultSharedModuleContext): {
	shared: LangiumSharedServices;
	yantrix: TDomainModelServices;
} {
	const shared = inject(
		createDefaultSharedModule(context),
		YantrixLanguageGeneratedSharedModule,
	);

	const yantrix = inject(
		createDefaultModule({ shared }),
		YantrixLanguageGeneratedModule,
		DomainModelModule,

	);

	shared.ServiceRegistry.register(yantrix);

	if (!context.connection) {
		shared.workspace.ConfigurationProvider.initialized({});
	}

	return { shared, yantrix };
}
