import { Request, Response, Handler } from "express";
import { z } from "zod";

import { numberComparisonSchema, dateRangeSchema, weatherComparisonSchema, Condition, Promocode } from "./model.js";
import { validateCondition } from "./validate.js";
import { WeatherAPIError, getFromLocation } from "../services/weather.js";
import InMemoryDatabase from "../inmemory-database.js";

class PromocodeNotFoundError extends Error {}

function promocodeValidation(promocode: any): Promocode {
  return z
    .object({
      name: z.string(),
      advantage: z.object({ percent: z.number() }),
      restrictions: z.array(z.any()).refine(conditionValidation, "Invalid list of conditions"),
    })
    .parse(promocode);
}

function conditionValidation(conditions: Condition[]): boolean {
  return conditions.every((condition) => {
    if ("age" in condition) {
      const result = numberComparisonSchema.safeParse(condition.age);
      return result.success && Object.keys(result.data).length > 0;
    }

    if ("date" in condition) {
      const result = dateRangeSchema.safeParse(condition.date);
      return result.success && Object.keys(result.data).length > 0;
    }

    if ("weather" in condition) {
      const result = weatherComparisonSchema.safeParse(condition.weather);
      return result.success && Object.keys(result.data).length > 0;
    }

    if ("or" in condition) {
      if (!Array.isArray(condition.or) || condition.or.length < 2) {
        return false;
      }
      return conditionValidation(condition.or);
    }

    if ("and" in condition) {
      if (!Array.isArray(condition.and) || condition.and.length < 2) {
        return false;
      }
      return conditionValidation(condition.and);
    }

    return false;
  });
}

function create(database: InMemoryDatabase): Handler {
  return async function (request: Request, response: Response) {
    try {
      const promocodeData = promocodeValidation(request.body);

      await database.promocodes.create(promocodeData);

      return response.status(201).json(promocodeData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return response.status(400).json({ message: "Invalid request body", details: error.issues });
      }

      return response.status(500).json({ message: "Internal Server Error" });
    }
  };
}

// Validate function
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
        ...(weather && town ? { weather: { city: town, main: weather.weather, temp: weather.temp } } : {}),
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
        return response.status(500).json({ message: "Failed to fetch weather data" });
      }

      return response.status(500).json({ message: "Internal Server Error" });
    }
  };
}

export default { create, validate };
