interface IPreferences {
	theme: string;
	dialogOpen: boolean;
}

export const preferencesMapper = {
	select: (model: Readonly<IPreferences>) => model.theme,
	hydrate: (model: Readonly<IPreferences>, theme: string): IPreferences => ({ ...model, theme }),
};

interface IPreferencesSnapshot {
	theme: string;
}

export const objectPreferencesMapper = {
	select: (model: Readonly<IPreferences>): IPreferencesSnapshot => ({ theme: model.theme }),
	hydrate: (model: Readonly<IPreferences>, snapshot: IPreferencesSnapshot): IPreferences => ({
		...model,
		...snapshot,
	}),
};
