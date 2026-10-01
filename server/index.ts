import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { handleGeminiRequest } from "./gemini.js";
import { api } from "./agents.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json({ limit: "64kb" }));

  // Health check
  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "careerpilot-ai",
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    });
  });

  // Gemini API
  app.post("/api/gemini", async (req, res) => {
    try {
      console.log("POST /api/gemini received");

      await handleGeminiRequest(req, res);
    } catch (error) {
      console.error("Gemini route error:", error);

      if (!res.headersSent) {
        res.status(500).json({
          ok: false,
          error: "Gemini request failed",
          message:
            error instanceof Error
              ? error.message
              : "Unknown server error",
        });
      }
    }
  });

  // Other APIs
  app.use("/api", api);

  // Static frontend
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // SPA fallback
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = Number(process.env.PORT) || 3000;

  server.listen(port, "0.0.0.0", () => {
    console.log(`CareerPilot AI server running on 0.0.0.0:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});