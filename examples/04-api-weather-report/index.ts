import { createHTTPRequestAdapter, TAutomataEventMetaType, TAutomataEventStack } from '@yantrix/automata';
import { getCoordinates } from './utils/weather_api';

enum WeatherEvents {
	FETCH_WEATHER = 1,
	WEATHER_RECEIVED,
}

type TWeatherMeta = {
	[WeatherEvents.FETCH_WEATHER]: { city: string };
	[WeatherEvents.WEATHER_RECEIVED]: { temperature: number };
};

const [weatherSource, weatherDestination] = createHTTPRequestAdapter<
	WeatherEvents,
	TWeatherMeta
>({
	routes: {
		[WeatherEvents.FETCH_WEATHER]: [

			(event: TAutomataEventMetaType<WeatherEvents.FETCH_WEATHER, TWeatherMeta>) => {
				const city = event?.meta?.city ?? 'Moscow';
				const { lat: latitude, lon: longitude } = getCoordinates(city);
				// console.log(latitude, longitude)

				return {
					method: 'GET',
					url: `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`,
				} as any & { url: string };
			},

			(response: any): TAutomataEventStack<WeatherEvents, TWeatherMeta> => {
				const temperature = response?.current_weather?.temperature ?? null;
				// console.log(temperature)
				return [
					{
						event: WeatherEvents.WEATHER_RECEIVED,
						meta: { temperature },
					},
				];
			},

		],
	},
});

(async () => {
	weatherSource.addListener('weather-listener', () => {
		// console.log(data)
		return [
			{
				event: WeatherEvents.WEATHER_RECEIVED,
				meta: { temperature: 37 },
			},
		];
	});

	const emitter = weatherSource.dataEmitter();

	weatherDestination.start();

	await weatherDestination.update({
		event: WeatherEvents.FETCH_WEATHER,
		meta: { city: 'Moscow' },
	});

	for await (const packet of emitter) {
		if (packet) {
			// console.log("DataEmitter выдал:", packet);
			break;
		}
	}
})();
