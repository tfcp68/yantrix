import { EventDictionary as GlobalEventDictionary, TAutomataEventMetaType, TAutomataEventStack } from '@yantrix/automata';

/**
 * Тестовые события для примера с погодой.
 * Нумерация условная. В реальном проекте ключи лучше регистрировать через EventDictionary.
 */
export enum WeatherEvents {
	UI_INPUT_CHANGED = 1,
	UI_SELECT_CITY = 2,
	UI_SUBMIT = 3,
	FETCH_WEATHER = 4,
	WEATHER_RESOLVED = 5,
	WEATHER_REJECTED = 6,
	UI_RENDER = 7,
}

export type TCityCoords = { lat: number; lon: number };

export type TWeatherMeta = {
	[WeatherEvents.UI_INPUT_CHANGED]: { coords: { lat: string | number; lon: string | number } | null };
	[WeatherEvents.UI_SELECT_CITY]: { city: string | null; coords: TCityCoords | null };
	[WeatherEvents.UI_SUBMIT]: { city: string | null; coords: TCityCoords };
	[WeatherEvents.FETCH_WEATHER]: { city: string | null; coords: TCityCoords };
	[WeatherEvents.WEATHER_RESOLVED]: {
		data: { temp: number | null; place: string; time: string; lat: number; lon: number };
	};
	[WeatherEvents.WEATHER_REJECTED]: { error: string };
	[WeatherEvents.UI_RENDER]: {};
};

export type TWeatherEvent = TAutomataEventMetaType<WeatherEvents, TWeatherMeta>;
export type TWeatherEventStack = TAutomataEventStack<WeatherEvents, TWeatherMeta>;

export function registerWeatherEvents(): void {
	GlobalEventDictionary.addEvents({
		keys: [
			'ui/inputChanged',
			'ui/selectCity',
			'ui/submit',
			'weather/fetch',
			'weather/resolved',
			'weather/rejected',
			'ui/render',
			'ui/inputsValid',
		],
	});
}
