import { describe, expect, it } from "vitest";
import { agents, runAgent } from "../../server/agents";

describe("agent orchestrator", () => {
  it("registers 14 agents with permissions and timeouts", () => {
    expect(agents).toHaveLength(14);
    expect(agents.every((a) => a.permissions.length && a.timeoutMs > 0)).toBe(true);
  });
  it("rejects unknown agents and invalid input", async () => {
    await expect(runAgent({ agent: "nope", task: "x", profile: {} })).rejects.toThrow();
    await expect(runAgent({ agent: "career-coach", task: "", profile: {} })).rejects.toThrow();
  });
  it("reports AI unavailable instead of fabricating when no key is set", async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(runAgent({ agent: "career-coach", task: "help", profile: {} })).rejects.toThrow(/unavailable/i);
  });
});
