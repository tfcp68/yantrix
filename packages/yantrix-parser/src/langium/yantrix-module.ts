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
import {
	YantrixGeneratedModule,
	YantrixGeneratedSharedModule,
	YantrixSequenceGeneratedModule,
} from '../generated/module.js';

export type TYantrixServices = LangiumCoreServices;

export const YantrixModule: Module<TYantrixServices, PartialLangiumCoreServices> = {
	// Add custom service implementations here
};

export const YantrixSequenceModule: Module<TYantrixServices, PartialLangiumCoreServices> = {
	// Add custom service implementations here
};

export function createYantrixServices(context: DefaultSharedCoreModuleContext): {
	shared: LangiumSharedCoreServices;
	Yantrix: TYantrixServices;
	YantrixSequence: TYantrixServices;
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
	const YantrixSequence = inject(
		createDefaultCoreModule({ shared }),
		YantrixSequenceGeneratedModule,
		YantrixSequenceModule,
	);
	shared.ServiceRegistry.register(Yantrix);
	shared.ServiceRegistry.register(YantrixSequence);
	return { shared, Yantrix, YantrixSequence };
}
