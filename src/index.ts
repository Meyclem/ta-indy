import dotenv from "dotenv";
import server from "./server.js";
import { stdout } from "process";

dotenv.config();

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  stdout.write(`🤖 Server is running on http://localhost:${PORT}`);
});
