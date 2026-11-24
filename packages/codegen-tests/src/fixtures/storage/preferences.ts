interface IPreferences {
	theme: string;
	dialogOpen: boolean;
}

export const preferencesMapper = {
	select: (model: Readonly<IPreferences>) => model.theme,
	hydrate: (model: Readonly<IPreferences>, theme: string): IPreferences => ({ ...model, theme }),
};
