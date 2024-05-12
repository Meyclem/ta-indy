import { Condition } from "./model.js";

class ValidationError extends Error {}

type AgeContext = number;
type DateContext = Date;
type WeatherContext = { main: string; temp: number; city: string };
type Context = { age?: AgeContext; date?: DateContext; weather?: WeatherContext };
type ValidationResult = { condition: string; success: boolean; reasons?: string[] | ValidationResult[] };

async function validateDate(condition: { after?: Date; before?: Date }, date: Date): Promise<ValidationResult> {
  const reasons: string[] = [];

  if ("after" in condition && condition.after instanceof Date && condition.after > date) {
    reasons.push(
      `Given date ${date.toISOString().substring(0, 10)} is not after ${condition.after.toISOString().substring(0, 10)}`,
    );
  }

  if ("before" in condition && condition.before instanceof Date && condition.before < date) {
    reasons.push(
      `Given date ${date.toISOString().substring(0, 10)} is not before ${condition.before.toISOString().substring(0, 10)}`,
    );
  }

  return { condition: "date", success: reasons.length === 0, ...(reasons.length > 0 && { reasons }) };
}

async function validateNumber(
  condition: { eq?: number; gt?: number; lt?: number },
  n: number,
  type: "age" | "temperature",
): Promise<ValidationResult> {
  const reasons: string[] = [];

  if ("eq" in condition && typeof condition.eq === "number" && condition.eq !== n) {
    reasons.push(`Given ${type} ${n} is not equal to ${condition.eq}`);
  }
  if ("gt" in condition && typeof condition.gt === "number" && condition.gt >= n) {
    reasons.push(`Given ${type} ${n} is not greater than ${condition.gt}`);
  }
  if ("lt" in condition && typeof condition.lt === "number" && condition.lt <= n) {
    reasons.push(`Given ${type} ${n} is not less than ${condition.lt}`);
  }

  return { condition: type, success: reasons.length === 0, ...(reasons.length > 0 && { reasons }) };
}

async function validateWeather(
  condition: {
    is: string;
    temp?: { eq?: number; gt?: number; lt?: number };
  },
  context: WeatherContext,
): Promise<ValidationResult> {
  const reasons: ValidationResult[] = [];

  if (condition.is !== context.main) {
    (reasons as unknown as string[]).push(
      `Current weather for ${context.city} '${context.main}' is not '${condition.is}'`,
    );
  }

  if ("temp" in condition && "temp" in context && typeof condition.temp === "object") {
    const result = await validateNumber(condition.temp, context.temp, "temperature");
    if (!result.success) {
      (reasons as unknown as ValidationResult[]).push(result);
    }
  }

  return { condition: "weather", success: reasons.length === 0, ...(reasons.length > 0 && { reasons }) };
}

async function validateCondition(condition: Condition, context: Context): Promise<ValidationResult> {
  if ("age" in condition && "age" in context && typeof context.age === "number") {
    return validateNumber(condition.age, context.age, "age");
  }

  if ("date" in condition && "date" in context && context.date instanceof Date) {
    return validateDate(condition.date, new Date(context.date));
  }

  if ("weather" in condition && "weather" in context && context.weather) {
    return validateWeather(condition.weather, context.weather);
  }

  throw new ValidationError("Invalid condition");
}

export { validateCondition };
