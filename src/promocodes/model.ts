import { z } from "zod";
import { WEATHER_CONDITIONS } from "../services/weather.js";

const numberComparisonSchema = z.object({
  eq: z.number().optional(),
  gt: z.number().optional(),
  lt: z.number().optional(),
});

const dateRangeSchema = z.object({
  after: z.date().optional(),
  before: z.date().optional(),
});

const weatherComparisonSchema = z.object({
  is: z.nativeEnum(WEATHER_CONDITIONS),
  temp: numberComparisonSchema.optional(),
});

type Condition =
  | { age: z.infer<typeof numberComparisonSchema> }
  | { date: z.infer<typeof dateRangeSchema> }
  | { weather: z.infer<typeof weatherComparisonSchema> }
  | { or: Condition[] }
  | { and: Condition[] };

export type { Condition };
