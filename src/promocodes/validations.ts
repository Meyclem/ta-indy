import { z } from "zod";

import {
  numberComparisonSchema,
  dateRangeSchema,
  weatherComparisonSchema,
  Condition,
  Promocode,
} from "./model.js";

function promocodeValidation(promocodePayload: Promocode): Promocode {
  return z
    .object({
      name: z.string(),
      advantage: z.object({ percent: z.number() }),
      /**
       * 👀 I added a custom Zod refinement to validate the list of conditions
       * because the recursive type validation of Zod is limited: https://zod.dev/?id=recursive-types
       * the `refine` method allows us to add custom validation logic and with more time
       * I could have added more specific error messages depending on the condition type.
       */
      restrictions: z
        .array(z.any())
        .refine(conditionValidation, "Invalid list of conditions"),
    })
    .parse(promocodePayload);
}

/**
 * Validates an array of conditions prior to creating a new Promocode
 *
 * @param conditions - An array of conditions to be validated against typed schemas.
 * @returns A boolean indicating whether all conditions are valid.
 */
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

export { promocodeValidation };
