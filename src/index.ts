import dotenv from "dotenv";
import createApp from "./server.js";
import { stdout } from "process";
import InMemoryDatabase from "./inmemory-database.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

const database = new InMemoryDatabase({ promocodes: [] });

const server = createApp(database);

server.listen(PORT, () => {
  stdout.write(`🤖 Server is running on http://localhost:${PORT}`);
});
