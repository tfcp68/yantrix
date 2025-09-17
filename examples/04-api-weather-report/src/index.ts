import {
	CoreLoop,
	EventBusAwareEventAdapter,
	IAutomataEventBus,
	TAutomataEventMetaType,
} from '@yantrix/automata';
import {
	registerWeatherEvents,
	TCityCoords,
	TWeatherMeta,
	WeatherEvents,
} from './events/weatherEvents';
import WeatherReportAutomata, { actionsDictionary, statesDictionary } from './generated/WeatherReportAutomata';

/**
 * Query an element from DOM by id and cast it to the expected type.
 * Throws if element is not found to fail fast during integration.
 * @param id Element id
 * @returns HTMLElement of requested type
 */
function $(id: string): HTMLElement {
	const el = document.getElementById(id);
	if (!el) throw new Error(`Element with id="${id}" not found`);
	return el;
}

/**
 * Get a human-readable state name based on numeric state id using FSM dictionary.
 * @param id Numeric state id or null
 * @returns Matching state name or the id converted to string
 */
function getStateName(id: number | null): string {
	const dict = statesDictionary as Record<string, number>;
	return Object.keys(statesDictionary).find(k => dict[k] === id) || String(id);
}

/**
 * Set display style for an element.
 * @param el HTML element
 * @param display CSS display value
 */
function setDisplay(el: HTMLElement, display: '' | 'block' | 'flex' | 'none'): void {
	el.style.display = display;
}

/**
 * Parse a coordinate string to a valid number in [-180; 180]. Returns null when invalid.
 * @param v Coordinate string
 * @returns Parsed number or null
 */
function parseCoord(v: string): number | null {
	const n = Number(String(v).trim());
	if (!Number.isFinite(n)) return null;
	if (Math.abs(n) > 180) return null;
	return n;
}

/**
 * Build Open-Meteo API URL for current weather.
 * @param lat Latitude
 * @param lon Longitude
 * @returns Request URL
 */
function buildWeatherUrl(lat: number | string, lon: number | string): string {
	return `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(
		lat,
	)}&longitude=${encodeURIComponent(lon)}&current_weather=true&timezone=UTC`;
}

/**
 * Determine if current FSM context contains a valid city and coordinates.
 * @param ctx FSM context object
 * @returns True when coordinates and city are present
 */
function isFormValid(ctx: any): boolean {
	return ctx?.coords?.lat != null && ctx?.coords?.lon != null && ctx?.city != null;
}

/**
 * Find a city name by approximate coordinates match (within ~0.01 degree).
 * @param cities Map of city name -> coords
 * @param lat Latitude to find
 * @param lon Longitude to find
 * @returns City label or null if not found
 */
function findCityLabelByCoords(cities: Record<string, TCityCoords>, lat: number, lon: number): string | null {
	const found = Object.entries(cities).find(
		([, c]) => Math.abs(c.lat - lat) < 0.01 && Math.abs(c.lon - lon) < 0.01,
	);
	return found ? found[0] : null;
}

/**
 * Fill a select element with given option labels, skipping already present values.
 * @param select Select element
 * @param labels Option values to ensure present
 */
function ensureSelectOptions(select: HTMLSelectElement, labels: string[]): void {
	const existing = new Set([...select.options].map(o => o.value));
	labels.forEach((name) => {
		if (existing.has(name)) return;
		const option = document.createElement('option');
		option.value = name;
		option.textContent = name;
		select.appendChild(option);
	});
}

/**
 * Create a helper for adding DOM listeners and tracking unsubscribe functions.
 * @param listeners Collector for unsubscribe callbacks
 * @returns Typed addEventListener wrapper
 */
function createBinder(listeners: Array<() => void>) {
	return function on<K extends keyof HTMLElementEventMap>(
		el: HTMLElement,
		type: K,
		cb: (ev: HTMLElementEventMap[K]) => void,
	): void {
		el.addEventListener(type, cb as any);
		listeners.push(() => el.removeEventListener(type, cb as any));
	};
}

const latInput = $(`lat`) as HTMLInputElement;
const lonInput = $(`lon`) as HTMLInputElement;
const citySelect = $(`city`) as HTMLSelectElement;
const submitBtn = $(`submitBtn`) as HTMLButtonElement;
const fillBtn = $(`fillBtn`) as HTMLButtonElement;
const firstPlaceholder = $(`firstPlaceholder`) as HTMLDivElement;
const loadingPanel = $(`loadingPanel`) as HTMLDivElement;
const resultPanel = $(`resultPanel`) as HTMLDivElement;
const errorEl = $(`error`) as HTMLDivElement;
const tempStr = $(`tempStr`) as HTMLDivElement;
const locStr = $(`locStr`) as HTMLDivElement;
const timeStr = $(`timeStr`) as HTMLDivElement;
const latStr = $(`latStr`) as HTMLDivElement;
const lonStr = $(`lonStr`) as HTMLDivElement;
const stateLabel = $(`stateLabel`) as HTMLDivElement;

/**
 * Demo city list with coordinates.
 */
const CITIES: Record<string, TCityCoords> = {
	'Bucharest': { lat: 44.4268, lon: 26.1025 },
	'London': { lat: 51.5074, lon: -0.1278 },
	'New York': { lat: 40.7128, lon: -74.006 },
	'Moscow': { lat: 55.7558, lon: 37.6173 },
	'Tokyo': { lat: 35.6895, lon: 139.6917 },
	'Sydney': { lat: -33.8688, lon: 151.2093 },
};

/**
 * Render UI based on the current FSM state and its context.
 * Updates panels visibility, result text and submit button state.
 * Avoids writing to form inputs to not fight with the user typing.
 * @param automata Weather FSM instance
 */
function render(automata: WeatherReportAutomata): void {
	const stateName = getStateName(automata.state);
	const ctx: any = (typeof automata.getContext === 'function') ? automata.getContext() : {};
	const c = ctx?.context ?? {};

	stateLabel.textContent = `State: ${stateName}`;

	// Reset UI
	errorEl.textContent = '';
	setDisplay(errorEl, 'none');
	setDisplay(firstPlaceholder, 'none');
	setDisplay(loadingPanel, 'none');
	setDisplay(resultPanel, 'none');

	// Panels
	switch (automata.state) {
		case statesDictionary.Idle:
		case statesDictionary.Filling:
			setDisplay(firstPlaceholder, 'block');
			break;
		case statesDictionary.Pending:
			setDisplay(loadingPanel, 'flex');
			break;
		case statesDictionary.Success:
			setDisplay(resultPanel, 'block');
			tempStr.textContent = c?.result?.temp !== undefined ? `${c.result.temp} °C` : '— °C';
			locStr.textContent = c?.result?.place ?? (c?.coords ? `${c.coords.lat}, ${c.coords.lon}` : '—');
			timeStr.textContent = c?.result?.time ?? '—';
			latStr.textContent = c?.result?.lat ?? '—';
			lonStr.textContent = c?.result?.lon ?? '—';
			break;
		case statesDictionary.Error:
			errorEl.textContent = c?.error ?? 'Unknown error';
			setDisplay(errorEl, '');
			setDisplay(firstPlaceholder, 'block');
			break;
		default:
			setDisplay(firstPlaceholder, 'block');
	}

	// Submit button available only in Filling with valid data
	submitBtn.disabled = !(automata.state === statesDictionary.Filling && isFormValid(c));
}

/**
 * Bind HTTP gateway that listens for FETCH_WEATHER events, performs API calls and dispatches RESOLVED/REJECTED.
 * Guarantees a minimum Pending duration to make loader visible.
 * @param bus Event bus instance
 * @returns Unsubscribe function
 */
function bindHttpWeatherGateway(bus: IAutomataEventBus<WeatherEvents, TWeatherMeta>): () => void {
	const handler = async ({ meta }: TAutomataEventMetaType<WeatherEvents.FETCH_WEATHER, TWeatherMeta>) => {
		try {
			const { lat, lon } = meta!.coords!;
			const city = meta!.city;
			const resp = await fetch(buildWeatherUrl(lat, lon));
			if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
			const data = await resp.json();

			bus.dispatch({
				event: WeatherEvents.WEATHER_RESOLVED,
				meta: {
					data: {
						temp: data?.current_weather?.temperature ?? null,
						place: city || `${Number(lat).toFixed(4)}, ${Number(lon).toFixed(4)}`,
						time: data?.current_weather?.time ?? new Date().toISOString(),
						lat: Number(lat),
						lon: Number(lon),
					},
				},
			});
		} catch (e: any) {
			bus.dispatch({
				event: WeatherEvents.WEATHER_REJECTED,
				meta: { error: String(e?.message ?? e) },
			});
		}
	};

	bus.subscribe(WeatherEvents.FETCH_WEATHER, handler as any);
	return () => bus.unsubscribe(WeatherEvents.FETCH_WEATHER, handler as any);
}

/**
 * Bind UI-render destination to render after state transitions or I/O completion.
 * @param bus Event bus
 * @param automata Weather FSM instance
 * @returns Unsubscribe function
 */
function bindUiRenderer(
	bus: IAutomataEventBus<WeatherEvents, TWeatherMeta>,
	automata: WeatherReportAutomata,
): () => void {
	const renderOn = [
		WeatherEvents.WEATHER_RESOLVED,
		WeatherEvents.WEATHER_REJECTED,
		WeatherEvents.UI_RENDER,
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
 * Create a DOM Source that converts user actions into Events for EventBus.
 * - Populates city options
 * - Syncs select change into lat/lon inputs
 * - Emits UI events for changes and submission
 * @returns Object with start/stop to attach/detach listeners
 */
function createDomSource(): {
	start: (publish: (e: TAutomataEventMetaType<WeatherEvents, TWeatherMeta>) => void) => void;
	stop: () => void;
} {
	const listeners: Array<() => void> = [];
	const on = createBinder(listeners);

	return {
		start(publish) {
			ensureSelectOptions(citySelect, Object.keys(CITIES));

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
				const coords = latVal === '' || lonVal === '' ? null : { lat: latVal, lon: lonVal };
				publish({ event: WeatherEvents.UI_INPUT_CHANGED, meta: { coords } });
			});

			on(lonInput, 'input', () => {
				const latVal = latInput.value.trim();
				const lonVal = lonInput.value.trim();
				const coords = latVal === '' || lonVal === '' ? null : { lat: latVal, lon: lonVal };
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
					label = findCityLabelByCoords(CITIES, lat, lon);
					citySelect.value = label ?? '';
				} else {
					citySelect.value = '';
					label = null;
				}
				publish({
					event: WeatherEvents.UI_SELECT_CITY,
					meta: { city: label, coords: label ? CITIES[label] : null },
				});
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
 * Build Event Adapter that:
 * - maps Events (UI and I/O) to FSM Actions
 * - emits Events when FSM enters certain States
 * @param bus Event bus
 * @returns Configured adapter instance
 */
function buildAdapter(bus: IAutomataEventBus<WeatherEvents, TWeatherMeta>) {
	const adapter = new EventBusAwareEventAdapter(
		bus as unknown as IAutomataEventBus<number, Record<number, any>>,
	);

	// Incoming: Event -> Action
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

	// Outgoing: State -> Event
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

/**
 * Entry point: assemble and start the CoreLoop for the weather demo.
 * - Registers events
 * - Builds FSM and Adapter
 * - Wires DOM source, HTTP gateway and UI renderer
 */
export function startWeatherCoreLoop(): void {
	registerWeatherEvents();

	const loop = new CoreLoop<WeatherEvents, TWeatherMeta>();
	const bus = loop.getBus();

	const automata = new WeatherReportAutomata();
	const adapter = buildAdapter(bus);

	loop.registerAutomata('weather', automata, adapter);

	const unbindHttp = bindHttpWeatherGateway(bus);
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
