import { afterEach, describe, expect, it, vi } from "vitest";
import { getFromLocation, WEATHER_CONDITIONS, WeatherAPIError } from "../../src/services/weather";

import type { MockedFunction } from "vitest";

global.fetch = vi.fn();

function createFetchResponse(data = {}, status = 200) {
  return { json: () => new Promise((resolve) => resolve(data)), status };
}

function mockFetch(data = {}, status = 200) {
  (fetch as MockedFunction<any>).mockResolvedValueOnce(createFetchResponse(data, status));
}

describe("Weather Service", () => {
  describe("#getFromLocation", () => {
    afterEach(() => {
      (fetch as MockedFunction<any>).mockClear();
    });

    it("Throws an error if the geocode API doesn't respond with a 200", async () => {
      expect.assertions(2);
      mockFetch({}, 401);

      try {
        await getFromLocation("New York");
      } catch (error) {
        expect(error).toBeInstanceOf(WeatherAPIError);
        expect(error.message).toEqual("Failed to fetch latitude and longitude");
      }
    });

    it("Throws an error if the weather API doesn't respond with a 200", async () => {
      expect.assertions(2);
      mockFetch([{ lat: 51.5073219, lon: -0.1276474 }], 200);
      mockFetch({}, 401);

      try {
        await getFromLocation("New York");
      } catch (error) {
        expect(error).toBeInstanceOf(WeatherAPIError);
        expect(error.message).toEqual("Failed to fetch weather for location");
      }
    });

    it("Responds with the right weather data for a given location", async () => {
      expect.assertions(1);
      const london = [
        {
          lat: 51.5073219,
          lon: -0.1276474,
        },
      ];

      const weather = {
        weather: [
          {
            main: WEATHER_CONDITIONS.RAIN,
          },
        ],
        main: {
          temp: 30,
        },
      };
      mockFetch(london, 200);
      mockFetch(weather);
      const result = await getFromLocation("London");

      expect(result).toEqual({
        weather: weather.weather[0].main,
        temp: weather.main.temp,
      });
    });
  });
});
