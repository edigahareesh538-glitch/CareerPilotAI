import { describe, expect, it } from "vitest";

describe("Gemini credentials", () => {
  it("can reach the Gemini models endpoint with the configured server secret", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey, "GEMINI_API_KEY must be configured").toBeTruthy();

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey as string)}`);
    expect(response.ok).toBe(true);
  }, 20_000);
});
