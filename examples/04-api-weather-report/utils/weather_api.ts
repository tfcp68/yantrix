type Location = { lat: number; lon: number };

export function getCoordinates(city: string): Location {
    const locations: Record<string, Location> = {
        Bucharest: { lat: 44.4268, lon: 26.1025 },
        London: { lat: 51.5074, lon: -0.1278 },
        NewYork: { lat: 40.7128, lon: -74.0060 },
        Moscow: { lat: 55.7558, lon: 37.6173 },
    };

    return locations[city] || locations["Bucharest"];
}


type WeatherResponse = {
    current: {
        temperature_2m: number;
        time: string;
    };
};

export async function getWeather(lat: number, lon: number) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`;

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Ошибка при запросе погоды: ${res.status}`);
    }

    const data: WeatherResponse = await res.json();
    return data.current.temperature_2m;
}
