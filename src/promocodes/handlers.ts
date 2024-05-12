import { Request, Response, Handler } from "express";
import { z } from "zod";

import { promocodeValidation } from "./validations.js";
import { validateCondition } from "./validate.js";
import { WeatherAPIError, getFromLocation } from "../services/weather.js";
import InMemoryDatabase from "../inmemory-database.js";

class PromocodeNotFoundError extends Error {}

function create(database: InMemoryDatabase): Handler {
  return async function (request: Request, response: Response) {
    try {
      const promocodeData = promocodeValidation(request.body);

      await database.promocodes.create(promocodeData);

      return response.status(201).json(promocodeData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return response
          .status(400)
          .json({ message: "Invalid request body", details: error.issues });
      }

      return response.status(500).json({ message: "Internal Server Error" });
    }
  };
}

function validate(database: InMemoryDatabase): Handler {
  return async function (request: Request, response: Response) {
    try {
      const {
        promocode_name: name,
        arguments: { age, town },
      } = z
        .object({
          promocode_name: z.string(),
          arguments: z.object({
            age: z.number().optional(),
            town: z.string().optional(),
          }),
        })
        .parse(request.body);

      /**
       * 👀 I decided the check if the weather based on the presence of the town parameter
       * to avoid making unnecessary requests to the weather API, but it also could have
       * been done on the first Weather condition validation.
       */
      const weather = town ? await getFromLocation(town) : null;

      const promocode = await database.promocodes.get({ name });

      if (!promocode) {
        throw new PromocodeNotFoundError();
      }

      const context = {
        age,
        date: new Date(),
      };

      const results = validateCondition(promocode.restrictions, {
        ...context,
        ...(weather && town
          ? {
              weather: {
                city: town,
                main: weather.weather,
                temp: weather.temp,
              },
            }
          : {}),
      });

      return response.status(200).json({
        promocode_name: promocode.name,
        status: results.success ? "accepted" : "rejected",
        ...(results.success && { advantage: promocode.advantage }),
        ...(!results.success && { reasons: results.reasons }),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return response.status(400).json({ message: "'name' is required" });
      }

      if (error instanceof PromocodeNotFoundError) {
        return response.status(404).json({ message: "Promocode not found" });
      }

      if (error instanceof WeatherAPIError) {
        return response
          .status(500)
          .json({ message: "Failed to fetch weather data" });
      }

      return response.status(500).json({ message: "Internal Server Error" });
    }
  };
}

export default { create, validate };
