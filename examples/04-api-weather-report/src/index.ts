import {
	AutomataEventAdapter,
	CoreLoop,
	createHTTPRequestAdapter,
	IAutomataEventBus,
	TAutomataEventMetaType,
	THTTPRequestAdapterOutput,
} from '@yantrix/automata';
import {
	registerWeatherEvents,
	TCityCoords,
	TWeatherMeta,
	WeatherEvents,
} from './events/weatherEvents';
import WeatherReportAutomata, { actionsDictionary, statesDictionary } from './generated/WeatherReportAutomata';

const $ = <T extends HTMLElement>(id: string): T =>
	document.getElementById(id) as T;

const latInput = $<HTMLInputElement>('lat');
const lonInput = $<HTMLInputElement>('lon');
const citySelect = $<HTMLSelectElement>('city');
const submitBtn = $<HTMLButtonElement>('submitBtn');
const fillBtn = $<HTMLButtonElement>('fillBtn');
const firstPlaceholder = $<HTMLDivElement>('firstPlaceholder');
const loadingPanel = $<HTMLDivElement>('loadingPanel');
const resultPanel = $<HTMLDivElement>('resultPanel');
const errorEl = $<HTMLDivElement>('error');

const tempStr = $<HTMLDivElement>('tempStr');
const locStr = $<HTMLDivElement>('locStr');
const timeStr = $<HTMLDivElement>('timeStr');
const latStr = $<HTMLDivElement>('latStr');
const lonStr = $<HTMLDivElement>('lonStr');

const stateLabel = $<HTMLDivElement>('stateLabel');

const CITIES: Record<string, TCityCoords> = {
	'Bucharest': { lat: 44.4268, lon: 26.1025 },
	'London': { lat: 51.5074, lon: -0.1278 },
	'New York': { lat: 40.7128, lon: -74.006 },
	'Moscow': { lat: 55.7558, lon: 37.6173 },
	'Tokyo': { lat: 35.6895, lon: 139.6917 },
	'Sydney': { lat: -33.8688, lon: 151.2093 },
};

function getStateName(id: number | null): string {
	return (
		Object.keys(statesDictionary).find(
			k => (statesDictionary as Record<string, number>)[k] === id,
		) || String(id)
	);
}

function render(automata: WeatherReportAutomata): void {
	const stateName = getStateName(automata.state);
	const ctx: any = (typeof automata.getContext === 'function') ? automata.getContext() : {};

	if (stateLabel) stateLabel.textContent = `State: ${stateName}`;

	errorEl.style.display = 'none';
	errorEl.textContent = '';

	firstPlaceholder.style.display = 'none';
	loadingPanel.style.display = 'none';
	resultPanel.style.display = 'none';

	switch (automata.state) {
		case statesDictionary.Idle:
			firstPlaceholder.style.display = 'block';
			break;
		case statesDictionary.Filling:
			firstPlaceholder.style.display = 'block';
			break;
		case statesDictionary.Pending:
			loadingPanel.style.display = 'flex';
			break;
		case statesDictionary.Success: {
			resultPanel.style.display = 'block';
			const { context: c } = automata.getContext?.() ?? {};
			tempStr.textContent = c?.result?.temp !== undefined ? `${c.result.temp} °C` : '— °C';
			locStr.textContent = c?.result?.place ?? (c?.coords ? `${c.coords.lat}, ${c.coords.lon}` : '—');
			timeStr.textContent = c?.result?.time ?? '—';
			latStr.textContent = c?.result?.lat ?? '—';
			lonStr.textContent = c?.result?.lon ?? '—';
			break;
		}
		case statesDictionary.Error:
			errorEl.style.display = '';
			errorEl.textContent = automata.getContext()?.context?.error ?? 'Unknown error';
			firstPlaceholder.style.display = 'block';
			break;
		default:
			firstPlaceholder.style.display = 'block';
	}

	const c = ctx?.context ?? {};
	const isValid = c?.coords?.lat != null && c?.coords?.lon != null && c?.city != null;
	submitBtn.disabled = !(automata.state === statesDictionary.Filling && isValid);
}

/**
 * Дестинейшн для обновления UI: слушает ключевые события и дергает render().
 */
function bindUiRenderer(
	bus: IAutomataEventBus<WeatherEvents, TWeatherMeta>,
	automata: WeatherReportAutomata,
): () => void {
	const renderOn = [
		WeatherEvents.WEATHER_RESOLVED,
		WeatherEvents.WEATHER_REJECTED,
		WeatherEvents.UI_RENDER,
		WeatherEvents.UI_SELECT_CITY,
	] as const;

	const handlers = renderOn.map((evt) => {
		const h = () => render(automata);
		bus.subscribe(evt, h as any);
		return { evt, h };
	});

	render(automata);

	return () => {
		handlers.forEach(({ evt, h }) => bus.unsubscribe(evt, h as any));
	};
}

/**
 * Источник DOM: преобразует пользовательские действия в события для EventBus.
 */
function createDomSource(): {
	start: (publish: (e: TAutomataEventMetaType<WeatherEvents, TWeatherMeta>) => void) => void;
	stop: () => void;
} {
	const listeners: Array<() => void> = [];

	function parseCoord(v: string): number | null {
		const n = Number(String(v).trim());
		if (!Number.isFinite(n)) return null;
		if (Math.abs(n) > 180) return null;
		return n;
	}

	function on<K extends keyof HTMLElementEventMap>(
		el: HTMLElement,
		type: K,
		cb: (ev: HTMLElementEventMap[K]) => void,
	) {
		el.addEventListener(type, cb as any);
		listeners.push(() => el.removeEventListener(type, cb as any));
	}

	return {
		start(publish) {
			Object.keys(CITIES).forEach((name) => {
				if ([...citySelect.options].some(o => o.value === name)) return;
				const option = document.createElement('option');
				option.value = name;
				option.textContent = name;
				citySelect.appendChild(option);
			});

			on(citySelect, 'change', () => {
				const name = citySelect.value || null;
				let coords: TCityCoords | null = null;
				if (name && CITIES[name]) {
					const c = CITIES[name];
					latInput.value = String(c.lat);
					lonInput.value = String(c.lon);
					coords = { lat: c.lat, lon: c.lon };
				}
				publish({ event: WeatherEvents.UI_SELECT_CITY, meta: { city: name, coords } });
			});

			on(latInput, 'input', () => {
				const latVal = latInput.value.trim();
				const lonVal = lonInput.value.trim();
				const coords = (latVal === '' || lonVal === '') ? null : { lat: latVal, lon: lonVal };
				publish({ event: WeatherEvents.UI_INPUT_CHANGED, meta: { coords } });
			});

			on(lonInput, 'input', () => {
				const latVal = lonInput.value.trim();
				const lonVal = lonInput.value.trim();
				const coords = (latVal === '' || lonVal === '') ? null : { lat: latVal, lon: lonVal };
				publish({ event: WeatherEvents.UI_INPUT_CHANGED, meta: { coords } });
			});

			on(latInput, 'focus', () => {
				publish({ event: WeatherEvents.UI_INPUT_CHANGED, meta: { coords: null } });
			});
			on(lonInput, 'focus', () => {
				publish({ event: WeatherEvents.UI_INPUT_CHANGED, meta: { coords: null } });
			});

			on(fillBtn, 'click', () => {
				const lat = Number.parseFloat(latInput.value);
				const lon = Number.parseFloat(lonInput.value);
				let label: string | null = null;
				if (Number.isFinite(lat) && Number.isFinite(lon)) {
					const found = Object.entries(CITIES)
						.find(([_, c]) => Math.abs(c.lat - lat) < 0.01 && Math.abs(c.lon - lon) < 0.01);
					label = found ? found[0] : null;
					citySelect.value = label ?? '';
				} else {
					citySelect.value = '';
					label = null;
				}
				publish({ event: WeatherEvents.UI_SELECT_CITY, meta: {
					city: label,
					coords: label ? CITIES[label] : null,
				} });
			});

			on(submitBtn, 'click', () => {
				const lat = parseCoord(latInput.value);
				const lon = parseCoord(lonInput.value);
				const city = citySelect.value || null;
				if (lat == null || lon == null || city == null) return;
				publish({ event: WeatherEvents.UI_SUBMIT, meta: { coords: { lat, lon }, city } });
			});
		},
		stop() {
			listeners.splice(0).forEach(un => un());
		},
	};
}

/**
 * Конфигурируем адаптер: подписки Event -> Action и эмиттеры State -> Event
 */
function buildAdapter() {
	const adapter = new AutomataEventAdapter();

	adapter.addEventListener(WeatherEvents.UI_INPUT_CHANGED, ({ meta }) => ({
		action: actionsDictionary.UpdateInput,
		payload: { coords: meta?.coords ?? null },
	}));

	adapter.addEventListener(WeatherEvents.UI_SELECT_CITY, ({ meta }) => ({
		action: actionsDictionary.UpdateSelect,
		payload: { city: meta?.city ?? null, coords: meta?.coords ?? null },
	}));

	adapter.addEventListener(WeatherEvents.UI_SUBMIT, ({ meta }) => ({
		action: actionsDictionary.Submit,
		payload: { coords: meta?.coords, city: meta?.city ?? null },
	}));

	adapter.addEventListener(WeatherEvents.WEATHER_RESOLVED, ({ meta }) => ({
		action: actionsDictionary.Resolve,
		payload: { data: meta?.data },
	}));

	adapter.addEventListener(WeatherEvents.WEATHER_REJECTED, ({ meta }) => ({
		action: actionsDictionary.Reject,
		payload: { error: meta?.error },
	}));

	adapter.addEventEmitter(statesDictionary.Pending, (state) => {
		const ctx: any = state?.context ?? {};
		return {
			event: WeatherEvents.FETCH_WEATHER,
			meta: { city: ctx?.city ?? null, coords: ctx?.coords },
		};
	});

	[
		statesDictionary.Filling,
		statesDictionary.Success,
		statesDictionary.Error,
		statesDictionary.Pending,
	].forEach((s) => {
		adapter.addEventEmitter(s, () => ({ event: WeatherEvents.UI_RENDER, meta: {} }));
	});

	return adapter;
}

/* ======================= */
/* HTTP ADAPTER INTEGRATION */
/* ======================= */

/**
 * Sleep helper
 */
function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
function nowMs(): number {
	return typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
}
async function ensureMinDuration(startTs: number, minMs: number) {
	const elapsed = nowMs() - startTs;
	if (elapsed < minMs) await sleep(minMs - elapsed);
}

/**
 * Маппер запросов для createHTTPRequestAdapter:
 */
function mapFetchWeatherRequest(
	event: TAutomataEventMetaType<WeatherEvents.FETCH_WEATHER, TWeatherMeta>,
): (RequestInit & { url: string }) | null {
	const lat = event?.meta?.coords?.lat;
	const lon = event?.meta?.coords?.lon;
	if (lat == null || lon == null) return null;
	return {
		method: 'GET',
		url: `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(
			lat,
		)}&longitude=${encodeURIComponent(lon)}&current_weather=true&timezone=UTC`,
	};
}

/**
 * Подключает DataSource/DataDestination HTTP-адаптеры к EventBus:
 */
function bindHttpWeatherAdapter(bus: IAutomataEventBus<WeatherEvents, TWeatherMeta>): () => void {
	const MIN_PENDING_MS = 1000;

	const [source, destination] = createHTTPRequestAdapter<WeatherEvents, TWeatherMeta>({
		routes: {
			[WeatherEvents.FETCH_WEATHER]: [mapFetchWeatherRequest as any, () => []],
		},
	});

	// Подписка шины на запросы: пробрасываем событие в Destination
	const fetchHandler = (ev: TAutomataEventMetaType<WeatherEvents.FETCH_WEATHER, TWeatherMeta>) => {
		destination.update(ev, null);
	};

	// Запуск адаптеров
	source.start();
	destination.start();
	bus.subscribe(WeatherEvents.FETCH_WEATHER, fetchHandler as any);

	let canceled = false;

	// Единый цикл обработки результатов/ошибок
	(async () => {
		const emitter = destination.requestEmitter();
		for (;;) {
			if (canceled) break;
			const next = emitter.next();
			const packet = next.value as
				| {
					data:
					{
						request: RequestInit & {
							url: string;
						};
						event_id: WeatherEvents;
					};
					result: THTTPRequestAdapterOutput | null;
					error?: any;
				}
				| null;

			if (!packet) {
				await sleep(10);
				continue;
			}

			const started = nowMs();

			// Ошибка запроса
			if (packet?.error) {
				await ensureMinDuration(started, MIN_PENDING_MS);
				bus.dispatch({
					event: WeatherEvents.WEATHER_REJECTED,
					meta: { error: String(packet.error?.message ?? packet.error ?? 'Request failed') },
				});
				continue;
			}

			try {
				const resp = packet?.result?.response;
				if (!resp) {
					await ensureMinDuration(started, MIN_PENDING_MS);
					bus.dispatch({
						event: WeatherEvents.WEATHER_REJECTED,
						meta: { error: 'Empty response' },
					});
					continue;
				}
				const data = await resp.json();

				const lat = Number(data?.latitude ?? Number.NaN);
				const lon = Number(data?.longitude ?? Number.NaN);
				const temp = data?.current_weather?.temperature ?? null;
				const time = data?.current_weather?.time ?? new Date().toISOString();

				const place
					= Number.isFinite(lat) && Number.isFinite(lon)
						? `${lat.toFixed(4)}, ${lon.toFixed(4)}`
						: '—';

				await ensureMinDuration(started, MIN_PENDING_MS);

				bus.dispatch({
					event: WeatherEvents.WEATHER_RESOLVED,
					meta: {
						data: {
							temp,
							place,
							time,
							lat: Number.isFinite(lat) ? lat : null,
							lon: Number.isFinite(lon) ? lon : null,
						},
					},
				});
			} catch (e: any) {
				await ensureMinDuration(started, MIN_PENDING_MS);
				bus.dispatch({
					event: WeatherEvents.WEATHER_REJECTED,
					meta: { error: String(e?.message ?? e) },
				});
			}
		}
	})().catch(console.error);

	return () => {
		canceled = true;
		bus.unsubscribe(WeatherEvents.FETCH_WEATHER, fetchHandler as any);
		source.stop();
		destination.stop();
	};
}

// Точка входа: собираем CoreLoop для примера с погодой.
export function startWeatherCoreLoop(): void {
	registerWeatherEvents();

	const loop = new CoreLoop<WeatherEvents, TWeatherMeta>();
	const bus = loop.getBus();

	const automata = new WeatherReportAutomata();
	const adapter = buildAdapter();

	loop.registerAutomata('weather', automata, adapter);

	const unbindHttp = bindHttpWeatherAdapter(bus);

	const unbindUi = bindUiRenderer(bus, automata);

	const domSource = createDomSource();
	loop.start();

	loop.registerSource({
		id: 'dom',
		start: publish => domSource.start(publish),
		stop: () => domSource.stop(),
	});

	(window as any).stopWeatherDemo = () => {
		unbindHttp();
		unbindUi();
		loop.stop();
	};
}

startWeatherCoreLoop();
