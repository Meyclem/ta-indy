import { describe, expect, it } from "vitest";
import request from "supertest";
import createApp from "../../src/server";
import InMemoryDatabase from "../../src/inmemory-database";

const database = new InMemoryDatabase({ promocodes: [] });
const app = createApp(database);

describe("GET /_healthz", () => {
  it("Responds with 200 OK", async () => {
    const res = await request(app).get("/_healthz");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ message: "OK" });
  });
});

describe("GET /non-existent-endpoint", () => {
  it("Responds with 404 Not Found", async () => {
    const res = await request(app).get("/non-existent-endpoint");
    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual({ message: "Not Found" });
  });
});
