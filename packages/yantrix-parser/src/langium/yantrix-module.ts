import {
	createDefaultCoreModule,
	createDefaultSharedCoreModule,
	DefaultSharedCoreModuleContext,
	inject,
	LangiumCoreServices,
	LangiumSharedCoreServices,
	Module,
	PartialLangiumCoreServices,
} from 'langium';
import { YantrixGeneratedModule, YantrixGeneratedSharedModule } from '../generated/module.js';

export type TYantrixServices = LangiumCoreServices;

export const YantrixModule: Module<TYantrixServices, PartialLangiumCoreServices> = {
	// Add custom service implementations here
};

export function createYantrixServices(context: DefaultSharedCoreModuleContext): {
	shared: LangiumSharedCoreServices;
	Yantrix: TYantrixServices;
} {
	const shared = inject(
		createDefaultSharedCoreModule(context),
		YantrixGeneratedSharedModule,
	);
	const Yantrix = inject(
		createDefaultCoreModule({ shared }),
		YantrixGeneratedModule,
		YantrixModule,
	);
	shared.ServiceRegistry.register(Yantrix);
	return { shared, Yantrix };
}
