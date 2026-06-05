import {
	AutomataEventAdapter,
	CoreLoop,
	createDataSourceAdapter,
	createPromiseDataAdapter,
	IAutomataEventBus,
	IDataSource,
	NamedDataSource,
	TAutomataEventMetaType,
} from '@yantrix/core';
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
 * UI destination: listens to key events and triggers render().
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
 * DOM source: converts user interactions into EventBus events.
 *
 * A real `IDataSource`: each DOM event is enqueued as a packet via `emit(...)`, and CoreLoop drains
 * the source (woken by the inherited notifier) and publishes the events. No `publish` callback, no
 * hand-rolled bridge.
 */
type TDomPacket = { ev: TAutomataEventMetaType<WeatherEvents, TWeatherMeta> };

function createDomSource(): IDataSource<WeatherEvents, TWeatherMeta, TDomPacket> {
	const DomSourceBase = createDataSourceAdapter<WeatherEvents, TWeatherMeta, TDomPacket>()(
		NamedDataSource<TDomPacket>,
	);

	function parseCoord(v: string): number | null {
		const n = Number(String(v).trim());
		if (!Number.isFinite(n)) return null;
		if (Math.abs(n) > 180) return null;
		return n;
	}

	class DomSource extends DomSourceBase {
		private domListeners: Array<() => void> = [];

		private emitEvent(ev: TAutomataEventMetaType<WeatherEvents, TWeatherMeta>): void {
			this._addDataPacket({ ev });
		}

		private on<K extends keyof HTMLElementEventMap>(
			el: HTMLElement,
			type: K,
			cb: (ev: HTMLElementEventMap[K]) => void,
		): void {
			el.addEventListener(type, cb as any);
			this.domListeners.push(() => el.removeEventListener(type, cb as any));
		}

		override start(): this {
			super.start();

			Object.keys(CITIES).forEach((name) => {
				if ([...citySelect.options].some(o => o.value === name)) return;
				const option = document.createElement('option');
				option.value = name;
				option.textContent = name;
				citySelect.appendChild(option);
			});

			this.on(citySelect, 'change', () => {
				const name = citySelect.value || null;
				let coords: TCityCoords | null = null;
				if (name && CITIES[name]) {
					const c = CITIES[name];
					latInput.value = String(c.lat);
					lonInput.value = String(c.lon);
					coords = { lat: c.lat, lon: c.lon };
				}
				this.emitEvent({ event: WeatherEvents.UI_SELECT_CITY, meta: { city: name, coords } });
			});

			this.on(latInput, 'input', () => {
				const latVal = latInput.value.trim();
				const lonVal = lonInput.value.trim();
				const coords = (latVal === '' || lonVal === '') ? null : { lat: latVal, lon: lonVal };
				this.emitEvent({ event: WeatherEvents.UI_INPUT_CHANGED, meta: { coords } });
			});

			this.on(lonInput, 'input', () => {
				const latVal = lonInput.value.trim();
				const lonVal = lonInput.value.trim();
				const coords = (latVal === '' || lonVal === '') ? null : { lat: latVal, lon: lonVal };
				this.emitEvent({ event: WeatherEvents.UI_INPUT_CHANGED, meta: { coords } });
			});

			this.on(latInput, 'focus', () => {
				this.emitEvent({ event: WeatherEvents.UI_INPUT_CHANGED, meta: { coords: null } });
			});
			this.on(lonInput, 'focus', () => {
				this.emitEvent({ event: WeatherEvents.UI_INPUT_CHANGED, meta: { coords: null } });
			});

			this.on(fillBtn, 'click', () => {
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
				this.emitEvent({ event: WeatherEvents.UI_SELECT_CITY, meta: {
					city: label,
					coords: label ? CITIES[label] : null,
				} });
			});

			this.on(submitBtn, 'click', () => {
				const lat = parseCoord(latInput.value);
				const lon = parseCoord(lonInput.value);
				const city = citySelect.value || null;
				if (lat == null || lon == null || city == null) return;
				this.emitEvent({ event: WeatherEvents.UI_SUBMIT, meta: { coords: { lat, lon }, city } });
			});

			return this;
		}

		override stop(): this {
			this.domListeners.splice(0).forEach(un => un());
			return super.stop();
		}
	}

	const src = new DomSource({ id: 'dom_source' });
	// Identity transform: each enqueued DOM event becomes a single published event.
	src.addListener('emit', (p: TDomPacket) => [p.ev]);
	return src as unknown as IDataSource<WeatherEvents, TWeatherMeta, TDomPacket>;
}

/**
 * Configure adapter: Event -> Action subscriptions and State -> Event emitters
 */
function buildAdapter() {
	const adapter = new AutomataEventAdapter();

	adapter.addEventListener(WeatherEvents.UI_INPUT_CHANGED, ({ meta }: TAutomataEventMetaType<WeatherEvents>) => ({
		action: actionsDictionary.UpdateInput,
		payload: { coords: meta?.coords ?? null },
	}));

	adapter.addEventListener(WeatherEvents.UI_SELECT_CITY, ({ meta }: TAutomataEventMetaType<WeatherEvents>) => ({
		action: actionsDictionary.UpdateSelect,
		payload: { city: meta?.city ?? null, coords: meta?.coords ?? null },
	}));

	adapter.addEventListener(WeatherEvents.UI_SUBMIT, ({ meta }: TAutomataEventMetaType<WeatherEvents>) => ({
		action: actionsDictionary.Submit,
		payload: { coords: meta?.coords, city: meta?.city ?? null },
	}));

	adapter.addEventListener(WeatherEvents.WEATHER_RESOLVED, ({ meta }: TAutomataEventMetaType<WeatherEvents>) => ({
		action: actionsDictionary.Resolve,
		payload: { data: meta?.data },
	}));

	adapter.addEventListener(WeatherEvents.WEATHER_REJECTED, ({ meta }: TAutomataEventMetaType<WeatherEvents>) => ({
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

const MIN_PENDING_MS = 1000;

/** Input the resolver receives: validated coordinates extracted from FETCH_WEATHER. */
type TFetchInput = { lat: number; lon: number };

/** Discriminated resolver output — never rejects, so a response event is always emitted. */
type TFetchOutput =
	| { ok: true; data: { temp: number | null; place: string; time: string; lat: number | null; lon: number | null } }
	| { ok: false; error: string };

/**
 * Weather HTTP adapter as a native `createPromiseDataAdapter`:
 *  - request: FETCH_WEATHER → `TFetchInput`
 *  - resolver: async fetch + JSON parse → `TFetchOutput` (resolved or rejected shape)
 *  - response: `TFetchOutput` → WEATHER_RESOLVED / WEATHER_REJECTED
 *
 * Returns `[IDataSource, IDataDestination]` that register directly with CoreLoop — no manual
 * `bus.subscribe`, no `requestEmitter()` polling, no `sleep(10)` loop. The loop pumps the source
 * (woken by the resolver pushing its result) and emits the follow-up event.
 */
function createWeatherHttpAdapter() {
	return createPromiseDataAdapter<WeatherEvents, TWeatherMeta, TFetchInput, TFetchOutput>({
		id: 'weather_http',
		requestEvents: [WeatherEvents.FETCH_WEATHER],
		requestMapper: (event) => {
			const meta = event?.meta as TWeatherMeta[WeatherEvents.FETCH_WEATHER] | undefined;
			const lat = meta?.coords?.lat;
			const lon = meta?.coords?.lon;
			if (lat == null || lon == null) return null;
			return { lat: Number(lat), lon: Number(lon) };
		},
		resolver: async (input): Promise<TFetchOutput> => {
			const started = nowMs();
			try {
				const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(
					input.lat,
				)}&longitude=${encodeURIComponent(input.lon)}&current_weather=true&timezone=UTC`;
				const resp = await fetch(url);
				if (resp.status !== 200) {
					await ensureMinDuration(started, MIN_PENDING_MS);
					return { ok: false, error: `HTTP Error ${resp.status}: ${resp.statusText}` };
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
				return {
					ok: true,
					data: {
						temp,
						place,
						time,
						lat: Number.isFinite(lat) ? lat : null,
						lon: Number.isFinite(lon) ? lon : null,
					},
				};
			} catch (e: any) {
				await ensureMinDuration(started, MIN_PENDING_MS);
				return { ok: false, error: String(e?.message ?? e) };
			}
		},
		responseMapper: out =>
			out.ok
				? [{ event: WeatherEvents.WEATHER_RESOLVED, meta: { data: out.data } }]
				: [{ event: WeatherEvents.WEATHER_REJECTED, meta: { error: out.error } }],
	});
}

export function startWeatherCoreLoop(): void {
	registerWeatherEvents();

	const loop = new CoreLoop<WeatherEvents, TWeatherMeta>();
	const bus = loop.getBus();

	const automata = new WeatherReportAutomata();
	const adapter = buildAdapter();

	loop.registerAutomata(automata, adapter);

	// HTTP I/O — both halves register directly; follow-up events flow through the loop.
	const [httpSource, httpDestination] = createWeatherHttpAdapter();
	loop.registerSource(httpSource);
	loop.registerDestination(httpDestination);

	const unbindUi = bindUiRenderer(bus, automata);

	// DOM input as a native source.
	loop.registerSource(createDomSource());

	loop.start();

	(window as any).stopWeatherDemo = () => {
		unbindUi();
		loop.stop();
	};
}

startWeatherCoreLoop();
