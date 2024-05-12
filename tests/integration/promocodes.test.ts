import { MockedFunction, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";

import { WEATHER_CONDITIONS } from "../../src/services/weather";
import createApp from "../../src/server";
import InMemoryDatabase from "../../src/inmemory-database";

global.fetch = vi.fn();

function createFetchResponse(data = {}, status = 200) {
  return { json: () => new Promise((resolve) => resolve(data)), status };
}

function mockFetchResponse(data = {}, status = 200) {
  (fetch as MockedFunction<any>).mockResolvedValueOnce(createFetchResponse(data, status));
}

const london = [
  {
    lat: 51.5073219,
    lon: -0.1276474,
  },
];

const weather = {
  weather: [
    {
      main: WEATHER_CONDITIONS.CLEAR,
    },
  ],
  main: {
    temp: 20,
  },
};

function mockFetchWeatherAPICall(latLon = london, weatherData = weather) {
  (fetch as MockedFunction<any>).mockImplementation((args) => {
    if (args && typeof args === "string" && args.includes("geo")) {
      return createFetchResponse(latLon, 200);
    }
    if (args && typeof args === "string" && args.includes("weather")) {
      return createFetchResponse(weatherData, 200);
    }
  });
}

const beachPromocode = {
  name: "Beach",
  advantage: { percent: 25 },
  restrictions: [
    {
      weather: {
        is: WEATHER_CONDITIONS.CLEAR,
      },
    },
  ],
};

const database = new InMemoryDatabase({ promocodes: [beachPromocode] });
const app = createApp(database);

describe("POST /promocodes", () => {
  it("Creates a new promocode", async () => {
    const newPromocode = {
      ...beachPromocode,
      name: "NewPromo",
    };

    const response = await request(app).post("/promocodes").send(newPromocode);

    expect(response.status).toEqual(201);
    expect(response.body).toEqual(newPromocode);
  });

  it("Responds with 400 if advantage and restrictions are not present", async () => {
    const response = await request(app).post("/promocodes").send({ name: "Invalid" });

    expect(response.status).toEqual(400);
    expect(response.body).toEqual({
      message: "Invalid request body",
      details: [
        {
          code: "invalid_type",
          expected: "object",
          received: "undefined",
          path: ["advantage"],
          message: "Required",
        },
        {
          code: "invalid_type",
          expected: "array",
          received: "undefined",
          path: ["restrictions"],
          message: "Required",
        },
      ],
    });
  });

  it("Responds with 400 if the conditions are not valid", async () => {
    const wrongPromocodes = [
      {
        name: "UnknownCondition",
        advantage: { percent: 25 },
        restrictions: [{ something: "invalid" }],
      },
      {
        name: "InvalidAgeCondition",
        advantage: { percent: 25 },
        restrictions: [{ age: { not: 23 } }],
      },
      {
        name: "InvalidDateCondition",
        advantage: { percent: 25 },
        restrictions: [{ date: { exact: "2021-01-01" } }],
      },
      {
        name: "InvalidWeatherCondition",
        advantage: { percent: 25 },
        restrictions: [{ weather: { is: "Sunny" } }],
      },
      {
        name: "InvalidOrCondition",
        advantage: { percent: 25 },
        restrictions: [{ or: [{ age: { eq: 18 } }] }],
      },
      {
        name: "InvalidOrCondition",
        advantage: { percent: 25 },
        restrictions: [{ or: [{ age: { min: 18 } }] }, { age: { max: 22 } }],
      },
      {
        name: "InvalidAndConditions",
        advantage: { percent: 25 },
        restrictions: [{ and: [{ age: { eq: 18 } }] }],
      },
      {
        name: "InvalidAndConditions",
        advantage: { percent: 25 },
        restrictions: [{ and: [{ age: { min: 18 } }] }, { age: { max: 22 } }],
      },
    ];

    expect.assertions(wrongPromocodes.length);

    await Promise.all(
      wrongPromocodes.map(async (promocode) => {
        const response = await request(app).post("/promocodes").send(promocode);

        expect(response.status).toEqual(400);
      }),
    );
  });
});

describe("POST /promocodes/validate", () => {
  const tensPromocode = {
    name: "Tens",
    advantage: { percent: 10 },
    restrictions: [
      {
        or: [
          {
            age: {
              eq: 20,
            },
          },
          {
            age: {
              eq: 30,
            },
          },
          {
            age: {
              eq: 40,
            },
          },
          {
            age: {
              eq: 50,
            },
          },
          {
            age: {
              eq: 60,
            },
          },
        ],
      },
    ],
  };

  beforeAll(() => {
    database.promocodes.create(tensPromocode);
  });

  it("Validates a promocode", async () => {
    const body = {
      promocode_name: beachPromocode.name,
      arguments: {
        age: 25,
        town: "London",
      },
    };

    mockFetchWeatherAPICall();
    const response = await request(app).post("/promocodes/validate").send(body);

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      promocode_name: beachPromocode.name,
      status: "accepted",
      advantage: beachPromocode.advantage,
    });
  });

  it("Rejects a promocode", async () => {
    const body = {
      promocode_name: beachPromocode.name,
      arguments: {
        age: 25,
        town: "London",
      },
    };

    mockFetchWeatherAPICall(london, { ...weather, weather: [{ main: WEATHER_CONDITIONS.RAIN }] });
    const response = await request(app).post("/promocodes/validate").send(body);

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      promocode_name: "Beach",
      status: "rejected",
      reasons: [
        { condition: "weather", success: false, reasons: ["Current weather for London 'Rain' is not 'Clear'"] },
      ],
    });
  });

  it("Validates 'or' condition", async () => {
    const body = {
      promocode_name: tensPromocode.name,
      arguments: {
        age: 50,
      },
    };

    const response = await request(app).post("/promocodes/validate").send(body);

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      promocode_name: tensPromocode.name,
      status: "accepted",
      advantage: tensPromocode.advantage,
    });
  });

  it("Rejects 'or' condition with reasons", async () => {
    const body = {
      promocode_name: tensPromocode.name,
      arguments: {
        age: 49,
      },
    };

    const response = await request(app).post("/promocodes/validate").send(body);

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      promocode_name: "Tens",
      status: "rejected",
      reasons: [
        {
          condition: "or",
          success: false,
          reasons: tensPromocode.restrictions[0].or.map((condition) => {
            return {
              condition: "age",
              success: false,
              reasons: [`Given age ${body.arguments.age} is not equal to ${condition.age.eq}`],
            };
          }),
        },
      ],
    });
  });
});
