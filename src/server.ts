import cors from "cors";
import express, { Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev", { skip: () => process.env.NODE_ENV === "test" }));
app.use(express.json());

app.get("/_healthz", (request: Request, response: Response) => {
  response.status(200).json({ message: "OK" });
});

app.get("*", (request: Request, response: Response) => {
  response.status(404).json({ message: "Not Found" });
});

export default app;
