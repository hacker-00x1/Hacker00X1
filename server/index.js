import express from "express";
import { registerRoutes } from "./routes.js";
import { setupAuth } from "./auth.js";
import { serveStatic } from "./static.js";
import { createServer } from "http";
import { storage } from "./storage.js";
import path from "path";

process.on("uncaughtException", (err) => {
  console.error("CRITICAL: Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("CRITICAL: Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

const app = express();
const httpServer = createServer(app);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

// Initialize auth middleware
setupAuth(app);

export function log(message, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        try {
          let stringified = JSON.stringify(capturedJsonResponse);
          if (stringified.length > 100) {
            stringified = stringified.substring(0, 100) + "... (truncated)";
          }
          logLine += ` :: ${stringified}`;
        } catch (e) {
          logLine += ` :: [JSON Serialization Error]`;
        }
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await storage.init();
  await registerRoutes(httpServer, app);

  app.use((err, _req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite.js");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
