// import fetch from "node-fetch";

async function testWeatherAPI() {
  try {
    const latitude = 55.7558;
    const longitude = 37.6173;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;

    console.log("URL запроса:", url);

    const request = new Request(url, {
        method: 'GET',
    });

    const response = await fetch(request);
 

    const data = await response.json() as any;
    console.log("Ответ API:", data);

    console.log("Температура:", data.current_weather?.temperature ?? "нет данных");
  } catch (err) {
    console.error("Ошибка при запросе:", err);
  }
}

testWeatherAPI();