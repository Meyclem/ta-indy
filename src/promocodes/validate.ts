import { Condition } from "./model.js";

class ValidationError extends Error {}

type AgeContext = number;
type DateContext = Date;
type WeatherContext = { main: string; temp: number; city: string };
type Context = {
  age?: AgeContext;
  date?: DateContext;
  weather?: WeatherContext;
};

/**
 * 👀 ValidationResult is a recursive type that can contain a list of reasons
 * if the validation fails, or a list of other ValidationResult for nested
 * conditions.
 */
type ValidationResult = {
  condition: string;
  success: boolean;
  reasons?: string[] | ValidationResult[];
};

function validateDate(
  condition: { after?: Date; before?: Date },
  date: Date,
): ValidationResult {
  const reasons: string[] = [];
  if (
    "after" in condition &&
    condition.after instanceof Date &&
    condition.after > date
  ) {
    reasons.push(
      `Given date ${date.toISOString().substring(0, 10)} is not after ${condition.after.toISOString().substring(0, 10)}`,
    );
  }

  if (
    "before" in condition &&
    condition.before instanceof Date &&
    condition.before < date
  ) {
    reasons.push(
      `Given date ${date.toISOString().substring(0, 10)} is not before ${condition.before.toISOString().substring(0, 10)}`,
    );
  }

  if (reasons.length > 0) {
    return {
      condition: "date",
      success: false,
      reasons,
    };
  }

  return {
    condition: "date",
    success: true,
  };
}

function validateNumber(
  condition: { eq?: number; gt?: number; lt?: number },
  n: number,
  type: "age" | "temperature",
): ValidationResult {
  const reasons: string[] = [];

  if (
    "eq" in condition &&
    typeof condition.eq === "number" &&
    condition.eq !== n
  ) {
    reasons.push(`Given ${type} ${n} is not equal to ${condition.eq}`);
  }
  if (
    "gt" in condition &&
    typeof condition.gt === "number" &&
    condition.gt >= n
  ) {
    reasons.push(`Given ${type} ${n} is not greater than ${condition.gt}`);
  }
  if (
    "lt" in condition &&
    typeof condition.lt === "number" &&
    condition.lt <= n
  ) {
    reasons.push(`Given ${type} ${n} is not less than ${condition.lt}`);
  }

  if (reasons.length > 0) {
    return {
      condition: type,
      success: false,
      reasons,
    };
  }

  return {
    condition: type,
    success: true,
  };
}

function validateWeather(
  condition: {
    is: string;
    temp?: { eq?: number; gt?: number; lt?: number };
  },
  context: WeatherContext,
): ValidationResult {
  const reasons: ValidationResult[] = [];

  if (condition.is !== context.main) {
    (reasons as unknown as string[]).push(
      `Current weather for ${context.city} '${context.main}' is not '${condition.is}'`,
    );
  }

  if (
    "temp" in condition &&
    "temp" in context &&
    typeof condition.temp === "object"
  ) {
    const result = validateNumber(condition.temp, context.temp, "temperature");
    if (!result.success) {
      (reasons as unknown as ValidationResult[]).push(result);
    }
  }

  if (reasons.length > 0) {
    return {
      condition: "weather",
      success: false,
      reasons,
    };
  }

  return {
    condition: "weather",
    success: true,
  };
}

/**
 * Validates the given condition against the provided context.
 *
 * @param condition - The condition to validate. It can be a single condition or an array of conditions.
 * @param context - The context against which the condition is validated: e.g: { age: 25, weather: { main: "Clear", temp: 10, city: "London" }
 * @returns The validation result, indicating whether the condition is valid or not and the reasons if it's not.
 * @throws {ValidationError} If the condition is invalid.
 */
function validateCondition(
  condition: Condition | Condition[],
  context: Context,
): ValidationResult {
  if (
    "age" in condition &&
    "age" in context &&
    typeof context.age === "number"
  ) {
    return validateNumber(condition.age, context.age, "age");
  }

  if (
    "date" in condition &&
    "date" in context &&
    context.date instanceof Date
  ) {
    return validateDate(condition.date, new Date(context.date));
  }

  if ("weather" in condition && "weather" in context && context.weather) {
    /**
     * 👀 I decided to give a context to the weather validation to avoid
     * having to call the weather API multiple times in case of nested
     * weather conditions in 'and' or 'or' conditions.
     */
    return validateWeather(condition.weather, context.weather);
  }

  if ("or" in condition) {
    const results = condition.or.map((subCondition) =>
      validateCondition(subCondition, context),
    );
    return {
      condition: "or",
      success: results.some((result) => result.success),
      reasons: results,
    };
  }

  if ("and" in condition) {
    const results = condition.and.map((subCondition) =>
      validateCondition(subCondition, context),
    );
    return {
      condition: "and",
      success: results.every((result) => result.success),
      reasons: results,
    };
  }

  if (Array.isArray(condition)) {
    /**
     * 👀 The case where the condition is an array of conditions only happens
     * when the object is the 'restrictions' property of a promocode.
     */
    const results = condition.map((subCondition) =>
      validateCondition(subCondition, context),
    );

    return {
      condition: "restrictions",
      success: results.some((result) => result.success),
      reasons: results,
    };
  }

  throw new ValidationError("Invalid condition");
}

export { validateCondition };
