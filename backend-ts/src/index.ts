import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { PORT, HOST, CORS_ORIGINS } from "./config.js";
import { apiRouter } from "./routes/api.js";

const app = express();

// Trust reverse proxies (Vercel, Render, Nginx)
app.set("trust proxy", 1);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      // In development or if wildcard specified, allow
      if (CORS_ORIGINS.includes("*") || CORS_ORIGINS.includes(origin) || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for easy local and preview deployment
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path !== "/health") {
      console.log(`[HTTP] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Routes
app.use(apiRouter);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({ detail: "Endpoint not found" });
});

// Global Error Handler
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Server Error]", err);
  res.status(500).json({ detail: (err as Error)?.message || "Internal server error" });
});

// Start listening
const server = app.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(`🚀 String Art TypeScript Backend running on http://${HOST}:${PORT}`);
  console.log(`   Health Check: http://localhost:${PORT}/health`);
  console.log(`   API Base:     http://localhost:${PORT}/api/`);
  console.log(`=======================================================`);
});

// Graceful shutdown
const shutdown = () => {
  console.log("Shutting down server...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
