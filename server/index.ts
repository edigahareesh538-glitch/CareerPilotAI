import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { handleGeminiRequest } from "./gemini.js";
import { api } from "./agents.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
 * ---------------------------------------------------------
 * SUPABASE CLIENT INITIALIZATION
 * ---------------------------------------------------------
 */
const supabaseUrl = process.env.SUPABASE_URL?.trim() || "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  process.env.SUPABASE_ANON_KEY?.trim() ||
  "";

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

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
      supabaseConfigured: Boolean(supabase),
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

  // Database route example: Save or retrieve profile
  app.post("/api/profile", async (req, res) => {
    if (!supabase) {
      return res.status(503).json({
        ok: false,
        error: "Supabase database client is not configured.",
      });
    }

    try {
      const profile = req.body;
      const { data, error } = await supabase
        .from("profiles")
        .upsert(profile)
        .select();

      if (error) {
        return res.status(400).json({ ok: false, error: error.message });
      }

      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : "Database error",
      });
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