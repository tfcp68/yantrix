import WeatherReportAutomata, { actionsDictionary, statesDictionary } from './generated/WeatherReportAutomata';

type TCityCoords = { lat: number; lon: number };

const CITIES: Record<string, TCityCoords> = {
	'Bucharest': { lat: 44.4268, lon: 26.1025 },
	'London': { lat: 51.5074, lon: -0.1278 },
	'New York': { lat: 40.7128, lon: -74.0060 },
	'Moscow': { lat: 55.7558, lon: 37.6173 },
	'Tokyo': { lat: 35.6895, lon: 139.6917 },
	'Sydney': { lat: -33.8688, lon: 151.2093 },
};

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

const automata = new WeatherReportAutomata();

const getStateName = (id: number | null): string =>
	Object.keys(statesDictionary).find(
		k => (statesDictionary as Record<string, number>)[k] === id,
	) || String(id);

function render(): void {
	const stateName = getStateName(automata.state);
	const ctx: any = (typeof automata.getContext === 'function') ? automata.getContext() : {};
	if (stateLabel) stateLabel.textContent = `State: ${stateName}`;

	// reset error
	errorEl.style.display = 'none';
	errorEl.textContent = '';

	// hide all
	firstPlaceholder.style.display = 'none';
	loadingPanel.style.display = 'none';
	resultPanel.style.display = 'none';

	switch (automata.state) {
		case statesDictionary.Idle:
			firstPlaceholder.style.display = 'block';
			break;
		case statesDictionary.Filling:
		case statesDictionary.Ready:
			firstPlaceholder.style.display = 'block';
			break;
		case statesDictionary.Pending:
			loadingPanel.style.display = 'flex';
			break;
		case statesDictionary.Success: {
			resultPanel.style.display = 'block';
			const { context: ctx } = automata.getContext?.() ?? {};
			tempStr.textContent = ctx.result?.temp !== undefined ? `${ctx.result.temp} °C` : '— °C';
			locStr.textContent = ctx.result?.place ?? (ctx.coords ? `${ctx.coords.lat}, ${ctx.coords.lon}` : '—');
			timeStr.textContent = ctx.result?.time ?? '—';
			latStr.textContent = ctx.result?.lat ?? '—';
			lonStr.textContent = ctx.result?.lon ?? '—';
			break;
		}
		case statesDictionary.Error:
			errorEl.style.display = '';
			errorEl.textContent = automata.getContext()?.error ?? 'Unknown error';
			firstPlaceholder.style.display = 'block';
			break;
		default:
			firstPlaceholder.style.display = 'block';
	}

	if (ctx.coords && ctx.coords.lat != null) latInput.value = String(ctx.coords.lat);
	if (ctx.coords && ctx.coords.lon != null) lonInput.value = String(ctx.coords.lon);
	if (ctx.city != null) citySelect.value = ctx.city;
}

function send(actionKey: number | string, payload: any = null): void {
	const actionName = Object.keys(actionsDictionary).find(
		k => (actionsDictionary as Record<string, number>)[k] === actionKey,
	) || String(actionKey);
	const action = WeatherReportAutomata.createAction(actionName, payload);
	try {
		automata.dispatch(action);
	} catch (err) {
		console.error('Dispatch error', err);
	}
	render();
}

// init cities
(function populateCities(): void {
	Object.keys(CITIES).forEach((name) => {
		const option = document.createElement('option');
		option.value = name;
		option.textContent = name;
		citySelect.appendChild(option);
	});
})();

citySelect.addEventListener('change', () => {
	const name = citySelect.value;
	let coords: TCityCoords | null = null;
	if (name && CITIES[name]) {
		const c = CITIES[name];
		latInput.value = String(c.lat);
		lonInput.value = String(c.lon);
		coords = { lat: c.lat, lon: c.lon };
	}
	send(actionsDictionary.SelectCity, { city: name || null, coords });
	validateInputs();
});

submitBtn.addEventListener('click', async () => {
	validateInputs();
	if (automata.state !== statesDictionary.Ready) return;

	const lat = parseCoord(latInput.value);
	const lon = parseCoord(lonInput.value);
	const city = citySelect.value || null;

	send(actionsDictionary.Submit, { coords: { lat, lon }, city });
	submitBtn.disabled = true;

	try {
		const data = await fetchWeather(lat!, lon!);
		const payload = { data: {
			temp: data.current_weather?.temperature ?? null,
			place: city || `${lat!.toFixed(4)}, ${lon!.toFixed(4)}`,
			time: data.current_weather?.time ?? (new Date()).toISOString(),
			lat,
			lon,
		} };
		send(actionsDictionary.Resolve, payload);
	} catch (err) {
		send(actionsDictionary.Reject, { error: String(err) });
	} finally {
		submitBtn.disabled = false;
	}
});

fillBtn.addEventListener('click', () => {
	const lat = Number.parseFloat(latInput.value);
	const lon = Number.parseFloat(lonInput.value);
	let label: string | null = '';
	if (Number.isFinite(lat) && Number.isFinite(lon)) {
		const found = Object.entries(CITIES)
			.find(([_, c]) => Math.abs(c.lat - lat) < 0.01 && Math.abs(c.lon - lon) < 0.01);
		if (found) {
			citySelect.value = found[0];
			label = found[0];
		} else {
			citySelect.value = '';
			label = null;
		}
	} else {
		citySelect.value = '';
		label = null;
	}
	send(actionsDictionary.UpdateSelect, { city: label });
});

latInput.addEventListener('input', () => {
	const latVal = latInput.value.trim();
	const lonVal = lonInput.value.trim();
	const coords = (latVal === '' || lonVal === '') ? null : { lat: latVal, lon: lonVal };
	send(actionsDictionary.UpdateInput, { coords });
});

lonInput.addEventListener('input', () => {
	const latVal = lonInput.value.trim();
	const lonVal = lonInput.value.trim();
	const coords = (latVal === '' || lonVal === '') ? null : { lat: latVal, lon: lonVal };
	send(actionsDictionary.UpdateInput, { coords });
});

latInput.addEventListener('focus', () => send(actionsDictionary.FocusInput));
lonInput.addEventListener('focus', () => send(actionsDictionary.FocusInput));

function parseCoord(v: string): number | null {
	const n = Number(String(v).trim());
	if (!Number.isFinite(n)) return null;
	if (Math.abs(n) > 180) return null;
	return n;
}

function isInputValid(): boolean {
	const lat = parseCoord(latInput.value);
	const lon = parseCoord(lonInput.value);
	const city = citySelect.value || null;
	return lat != null && lon != null && city != null;
}

function validateInputs(): void {
	const ctx: any = automata.getContext?.() ?? {};
	if (isInputValid()) {
		send(actionsDictionary.InputsValid, ctx?.context);
	}
}

let controller: AbortController | null = null;

async function fetchWeather(lat: number, lon: number): Promise<any> {
	if (controller) {
		try {
			controller.abort();
		} catch {
			// ignore
		}
	}
	controller = new AbortController();
	const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current_weather=true&timezone=UTC`;
	const resp = await fetch(url, { signal: controller.signal });
	if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
	return await resp.json();
}

render();
