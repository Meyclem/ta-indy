import { describe, expect, it } from "vitest";
import { validateCondition } from "../../../src/promocodes/validate";
import { WEATHER_CONDITIONS } from "../../../src/services/weather";
import { Condition } from "../../../src/promocodes/model";

describe("Promocode Validation", () => {
  describe("Age condition", () => {
    it("Validates a simple age condition", async () => {
      const condition = { age: { eq: 18 } };
      const context = { age: 18 };
      const result = validateCondition(condition, context);

      expect(result).toEqual({ success: true, condition: "age" });
    });

    it("Fails a simple age condition", async () => {
      const condition = { age: { eq: 18 } };
      const context = { age: 21 };
      const result = validateCondition(condition, context);

      expect(result).toEqual({
        condition: "age",
        success: false,
        reasons: [`Given age ${context.age} is not equal to ${condition.age.eq}`],
      });
    });

    it("Validates a more complex age condition", async () => {
      const condition = { age: { gt: 18, lt: 30 } };
      const context = { age: 25 };
      const result = validateCondition(condition, context);

      expect(result).toEqual({
        condition: "age",
        success: true,
      });
    });

    it("Fails a complex age condition", async () => {
      const condition = { age: { gt: 18, lt: 30 } };
      const context = { age: 35 };
      const result = validateCondition(condition, context);

      expect(result).toEqual({
        condition: "age",
        success: false,
        reasons: [`Given age ${context.age} is not less than ${condition.age.lt}`],
      });
    });
  });

  describe("Date condition", () => {
    it("Validates date conditions", async () => {
      const condition = { date: { before: new Date("2021-12-31") } };
      const context = { date: new Date("2021-11-01") };
      const result = validateCondition(condition, context);

      expect(result).toEqual({ condition: "date", success: true });
    });

    it("Fails date conditions", async () => {
      const condition = { date: { before: new Date("2021-12-31") } };
      const context = { date: new Date("2022-01-01") };
      const result = validateCondition(condition, context);

      expect(result).toEqual({
        condition: "date",
        success: false,
        reasons: [
          `Given date ${context.date.toISOString().substring(0, 10)} is not before ${condition.date.before.toISOString().substring(0, 10)}`,
        ],
      });
    });

    it("Validates date conditions with after", async () => {
      const condition = { date: { after: new Date("2021-01-01") } };
      const context = { date: new Date("2021-11-01") };
      const result = validateCondition(condition, context);

      expect(result).toEqual({ condition: "date", success: true });
    });

    it("Fails date conditions with after", async () => {
      const condition = { date: { after: new Date("2000-01-01") } };
      const context = { date: new Date("1900-11-01") };
      const result = validateCondition(condition, context);

      expect(result).toEqual({
        condition: "date",
        success: false,
        reasons: [
          `Given date ${context.date.toISOString().substring(0, 10)} is not after ${condition.date.after.toISOString().substring(0, 10)}`,
        ],
      });
    });

    it("Validates date conditions with both", async () => {
      const condition = {
        date: { after: new Date("2021-01-01"), before: new Date("2021-12-31") },
      };
      const context = { date: new Date("2021-11-01") };
      const result = validateCondition(condition, context);

      expect(result).toEqual({ condition: "date", success: true });
    });
  });

  describe("Weather condition", () => {
    it("Validates weather conditions", async () => {
      const condition = {
        weather: { is: WEATHER_CONDITIONS.CLEAR, temp: { eq: 10 } },
      };
      const context = { weather: { city: "London", main: WEATHER_CONDITIONS.CLEAR, temp: 10 } };

      const result = validateCondition(condition, context);

      expect(result).toEqual({ condition: "weather", success: true });
    });

    it("Fails weather conditions", async () => {
      const condition = {
        weather: { is: WEATHER_CONDITIONS.CLEAR, temp: { eq: 10 } },
      };
      const context = { weather: { city: "London", main: WEATHER_CONDITIONS.RAIN, temp: 10 } };

      const result = validateCondition(condition, context);

      expect(result).toEqual({
        condition: "weather",
        success: false,
        reasons: [
          `Current weather for ${context.weather.city} '${context.weather.main}' is not '${condition.weather.is}'`,
        ],
      });
    });

    it("Fails temperature conditions", async () => {
      const condition = {
        weather: { is: WEATHER_CONDITIONS.CLEAR, temp: { eq: 10 } },
      };
      const context = { weather: { city: "London", main: WEATHER_CONDITIONS.CLEAR, temp: 20 } };

      const result = validateCondition(condition, context);

      expect(result).toEqual({
        condition: "weather",
        success: false,
        reasons: [
          {
            condition: "temperature",
            success: false,
            reasons: [`Given temperature 20 is not equal to 10`],
          },
        ],
      });
    });

    it("Fails temperature and weather conditions", async () => {
      const condition = {
        weather: { is: WEATHER_CONDITIONS.CLEAR, temp: { eq: 10 } },
      };
      const context = { weather: { city: "London", main: WEATHER_CONDITIONS.RAIN, temp: 20 } };

      const result = validateCondition(condition, context);

      expect(result).toEqual({
        condition: "weather",
        success: false,
        reasons: [
          `Current weather for ${context.weather.city} '${context.weather.main}' is not '${condition.weather.is}'`,
          {
            condition: "temperature",
            success: false,
            reasons: [`Given temperature 20 is not equal to 10`],
          },
        ],
      });
    });
  });

  describe("Or and And conditions", () => {
    it("Validates 'or' condition", async () => {
      const condition: Condition = {
        or: [{ age: { eq: 25 } }, { age: { eq: 30 } }, { age: { gt: 75 } }],
      };

      const context = {
        age: 30,
      };

      const result = validateCondition(condition, context);
      expect(result).toEqual({
        condition: "or",
        success: true,
        reasons: [
          { condition: "age", success: false, reasons: [`Given age ${context.age} is not equal to 25`] },
          { condition: "age", success: true },
          { condition: "age", success: false, reasons: [`Given age ${context.age} is not greater than 75`] },
        ],
      });
    });

    it("Validates 'and' condition", async () => {
      const condition: Condition = {
        and: [{ age: { lt: 30 } }, { age: { gt: 20 } }],
      };

      const context = {
        age: 25,
      };

      const result = validateCondition(condition, context);

      expect(result).toEqual({
        condition: "and",
        success: true,
        reasons: [
          { condition: "age", success: true },
          { condition: "age", success: true },
        ],
      });
    });

    it("Validates 'or' and 'and' conditions", async () => {
      const condition: Condition = {
        or: [
          { age: { eq: 25 } },
          {
            and: [
              { weather: { is: WEATHER_CONDITIONS.CLEAR, temp: { eq: 10 } } },
              { date: { before: new Date("2023-01-01") } },
            ],
          },
        ],
      };

      const context = {
        age: 30,
        weather: { city: "London", main: WEATHER_CONDITIONS.CLEAR, temp: 10 },
        date: new Date("2022-01-01"),
      };

      const result = validateCondition(condition, context);

      expect(result).toEqual({
        condition: "or",
        success: true,
        reasons: [
          {
            condition: "age",
            success: false,
            reasons: [`Given age 30 is not equal to 25`],
          },
          {
            condition: "and",
            success: true,
            reasons: [
              { condition: "weather", success: true },
              { condition: "date", success: true },
            ],
          },
        ],
      });
    });
  });
});
