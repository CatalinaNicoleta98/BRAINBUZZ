import { createServer } from "node:http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connect } from "./db/connectToDatabase.js";
import { seedQuizLibrary } from "./services/seedService.js";
import { registerSocketHandlers } from "./sockets/registerSocketHandlers.js";

async function bootstrap() {
  await connect();
  await seedQuizLibrary();

  const app = createApp();
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS,
      credentials: true,
    },
  });

  registerSocketHandlers(io);

  httpServer.listen(env.PORT, () => {
    console.log(`BrainBuzz backend listening on port ${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start BrainBuzz backend", error);
  process.exit(1);
});
