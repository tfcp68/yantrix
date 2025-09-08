import { createHTTPRequestAdapter, TAutomataEventMetaType, TAutomataEventStack,  THTTPRequestAdapterOutput} from '@yantrix/automata';
import { getCoordinates } from './utils/weather_api';

enum WeatherEvents {
	FETCH_WEATHER = 1,
	WEATHER_RECEIVED = 2,
}

type TWeatherMeta = {
	[WeatherEvents.FETCH_WEATHER]: { city: string };
	[WeatherEvents.WEATHER_RECEIVED]: { temperature: number };
};

const fetchWeatherRequest = (
  event: TAutomataEventMetaType<WeatherEvents.FETCH_WEATHER, TWeatherMeta>
): RequestInit & { url: string } => {

  const city = event?.meta?.city;

  if (!city) {
    throw new Error("Should provide city name in event meta");
  }

  const { lat: latitude, lon: longitude } = getCoordinates(city);

  return {
    method: "GET",
    url: `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`,
  };
};

const fetchWeatherResponse = (
  response: any
): TAutomataEventStack<WeatherEvents, TWeatherMeta> => {

  const temperature = response?.current_weather?.temperature ?? null;

  return [
    {
      event: WeatherEvents.WEATHER_RECEIVED,
      meta: { temperature },
    },
  ];
};


const [weatherSource, weatherDestination] = createHTTPRequestAdapter<
	WeatherEvents,
	TWeatherMeta
>({
	routes: {
		[WeatherEvents.FETCH_WEATHER]: [fetchWeatherRequest, fetchWeatherResponse]
	},
});


type Saga<T> = (packet: THTTPRequestAdapterOutput) => Promise<void> | void;


async function runSagas<T>(emitter: IterableIterator<THTTPRequestAdapterOutput | null>, sagas: Saga<T>[]) {
  for await (const packet of emitter) {
    if (!packet) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      continue;
    }
    
    for (const saga of sagas) {
      try {
        await saga(packet);
        break;
      } catch (err) {
        console.error("Ошибка в саге:", err);
      }
    }
  }
}


async function initWeatherFlow(city: string) {
  weatherSource.start();
  weatherDestination.start();

  weatherDestination.update({
    event: WeatherEvents.FETCH_WEATHER,
    meta: { city },
  });

  const emitter = weatherSource.dataEmitter();

  await runSagas(emitter, [
    async (packet) => {
      const { response } = packet;
      const data = await response.json();
      console.log("Saga received data:", data);

      weatherSource.stop();
      weatherDestination.stop();
    },
  ]);
}

initWeatherFlow("Moscow");
