/*
 * StorySeed HTTP server (local / Hostinger long-running).
 */
import "dotenv/config";
import { createServer } from "http";
import net from "net";
import { createApp } from "./app";
import { serveStatic } from "./static";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.on("error", (error) => { console.error(error); process.exitCode = 1; });
  server.listen(port, "0.0.0.0", () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = createApp();
  const server = createServer(app);

  if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000", 10);
  if (!Number.isInteger(preferredPort) || preferredPort < 1 || preferredPort > 65535) throw new Error("Invalid PORT");
  const port = process.env.NODE_ENV === "development" ? await findAvailablePort(preferredPort) : preferredPort;

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.on("error", (error) => { console.error(error); process.exitCode = 1; });
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch((error) => { console.error(error); process.exitCode = 1; });
