import { z } from "zod";

enum WEATHER_CONDITIONS {
  ATMOSPHERE = "Atmosphere",
  CLEAR = "Clear",
  CLOUDS = "Clouds",
  DRIZZLE = "Drizzle",
  MIST = "Mist",
  RAIN = "Rain",
  SNOW = "Snow",
  THUNDERSTORM = "Thunderstorm",
}

const weatherConditions = z.nativeEnum(WEATHER_CONDITIONS);
type Condition = z.infer<typeof weatherConditions>;

type Weather = {
  weather: Condition;
  temp: number;
};

class WeatherAPIError extends Error {}

async function getCoordinates(
  city: string,
): Promise<{ lat: number; lon: number }> {
  const response = await fetch(
    `http://api.openweathermap.org/geo/1.0/direct?q=${city}&appid=${process.env.OPEN_WEATHER_API_KEY}`,
  );

  /**
   * 👀 Right now, the function only handles 200 and not-200 responses.
   * It would be better to handle other status codes and react accordingly.
   */
  if (response.status !== 200) {
    throw new WeatherAPIError("Failed to fetch latitude and longitude");
  }

  const body = await response.json();

  const result = z
    .array(
      z.object({
        lat: z.number(),
        lon: z.number(),
      }),
    )
    .safeParse(body);

  if (!result.success) {
    throw new WeatherAPIError("Failed to parse lat and lon");
  }

  const [{ lat, lon }] = result.data;

  return { lat, lon };
}

async function getWeatherFromLatLon(
  lat: number,
  lon: number,
): Promise<Weather> {
  const response = await fetch(
    `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.OPEN_WEATHER_API_KEY}`,
  );

  /**
   * 👀 Right now, the function only handles 200 and not-200 responses.
   * It would be better to handle other status codes and react accordingly.
   */
  if (response.status !== 200) {
    throw new WeatherAPIError("Failed to fetch weather for location");
  }

  const body = await response.json();

  const weatherData = z
    .object({
      weather: z.array(
        z.object({
          main: weatherConditions,
        }),
      ),
      main: z.object({
        temp: z.number(),
      }),
    })
    .safeParse(body);

  if (!weatherData.success) {
    throw new WeatherAPIError("Failed to parse weather data");
  }

  return {
    weather: weatherData.data.weather[0].main,
    temp: weatherData.data.main.temp,
  };
}

/**
 * Retrieves weather information based on the provided city.
 * @param city - The name of the city.
 * @returns A Promise that resolves to the weather information for the city.
 * @throws {WeatherAPIError} If the weather API returns an error.
 */
async function getFromLocation(city: string): Promise<Weather> {
  const { lat, lon } = await getCoordinates(city);

  return getWeatherFromLatLon(lat, lon);
  /**
   * 👀 With more time, I think it would be necessary to add more error handling
   * and possibly retry logic.
   */
}

export { getFromLocation, WEATHER_CONDITIONS, WeatherAPIError };
export type { Condition, Weather };
