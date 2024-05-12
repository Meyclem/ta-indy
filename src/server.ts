import cors from "cors";
import express, { Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";

import InMemoryDatabase from "./inmemory-database.js";
import promocodeHandlers from "./promocodes/handlers.js";

/**
 * Creates and configures the Express app.
 *
 * @param {InMemoryDatabase} database - The in-memory database instance.
 * @returns {express.Application} The configured Express app.
 */
function createApp(database: InMemoryDatabase) {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(morgan("dev", { skip: () => process.env.NODE_ENV === "test" }));
  app.use(express.json());

  app.get("/_healthz", (request: Request, response: Response) => {
    response.status(200).json({ message: "OK" });
  });

  app.post("/promocodes", promocodeHandlers.create(database));
  app.post("/promocodes/validate", promocodeHandlers.validate(database));

  app.get("*", (request: Request, response: Response) => {
    response.status(404).json({ message: "Not Found" });
  });

  return app;
}

export default createApp;
