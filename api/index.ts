import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";
import { createServer } from "http";
import { initializeEmailTransporter } from "../server/email";

const app = express();

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// Initialize once (Vercel may reuse the container)
let initialized = false;
const initPromise = (async () => {
  if (initialized) return;
  initialized = true;

  initializeEmailTransporter();

  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });
})();

export default async function handler(req: Request, res: Response) {
  await initPromise;
  app(req, res);
}
