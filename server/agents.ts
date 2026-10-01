import "dotenv/config";
import express from "express";
import { z } from "zod";
import { generate, isGeminiConfigured } from "./gemini.js";

/** LLM provider abstraction. Add providers here; the first available one is used. */
export interface LLMProvider { name: string; available(): boolean; complete(prompt: string, system: string): Promise<string>; }
export const providers: LLMProvider[] = [{ name: "gemini", available: isGeminiConfigured, complete: generate }];
const llm = () => providers.find((p) => p.available());

export class Unavailable extends Error {}
const list = (n: number, m = 80) => z.array(z.string().max(m)).max(n).default([]);
const Profile = z.object({ targetRole: z.string().max(100).default(""), skills: list(40, 60), missingSkills: list(15, 60), projects: list(8, 200), experience: list(8, 200), education: list(4, 200) }).default({ targetRole: "", skills: [], missingSkills: [], projects: [], experience: [], education: [] });
const RunBody = z.object({ agent: z.string().max(40), task: z.string().trim().min(1).max(1500), profile: Profile });
type Ctx = z.infer<typeof RunBody>;

type AgentDef = { id: string; name: string; permissions: string[]; tools: string[]; timeoutMs: number; retries: number; perMinute: number; system: string };
const llmAgent = (id: string, name: string, system: string): AgentDef => ({ id, name, permissions: ["read:profile", "llm"], tools: ["llm"], timeoutMs: 30_000, retries: 1, perMinute: 20, system });
export const agents: AgentDef[] = [
  { id: "job-discovery", name: "Job Discovery Agent", permissions: ["read:profile", "net:remotive"], tools: ["remotive.search"], timeoutMs: 12_000, retries: 1, perMinute: 20, system: "" },
  llmAgent("resume-analyzer", "Resume Analyzer Agent", "You review resumes. Give concrete, evidence-based improvements."),
  { id: "trending-jobs", name: "Trending Jobs Agent", permissions: ["net:remotive"], tools: ["remotive.aggregate"], timeoutMs: 12_000, retries: 1, perMinute: 10, system: "" },
  llmAgent("job-research", "Job Research Agent", "You research a role/company from the provided text only; state what you cannot know."),
  llmAgent("skill-matching", "Skill Matching Agent", "Compare candidate skills with the job skills given. List matched and missing skills."),
  llmAgent("job-ranking", "Job Ranking Agent", "Rank the jobs given by fit and explain. Scores are estimates, not objective truth."),
  llmAgent("skill-gap", "Skill Gap Agent", "Explain the candidate's skill gaps for the target role and their priority."),
  llmAgent("learning-roadmap", "Learning Roadmap Agent", "Create a week-by-week plan: objective, resource TYPES to search for, assignment, practice, assessment. Do not invent URLs."),
  llmAgent("application-prep", "Application Preparation Agent", "Draft cover letters/answers using only facts in the profile. Never fabricate experience. The user must review before sending."),
  llmAgent("career-coach", "Career Coach Agent", "You are a concise, honest career coach. Give actionable next steps."),
  llmAgent("interview", "Interview Agent", "Ask one dynamic interview question or follow-up grounded in the profile and the previous answer."),
  llmAgent("assessment", "Assessment Agent", "Create a short assessment (MCQ/coding/scenario) with an answer key and explanations for the skill requested."),
  { id: "trending-courses", name: "Trending Courses Agent", permissions: ["net:youtube"], tools: ["youtube.search"], timeoutMs: 12_000, retries: 1, perMinute: 20, system: "" },
  llmAgent("challenge", "Challenge Agent", "Create a weekly challenge for the skill requested with a clear success criterion."),
  llmAgent("company-prep", "Company Preparation Agent", "Create interview preparation for the company/role. Label everything AI-generated; never claim these are real current company questions."),
];

const withTimeout = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`Timed out after ${ms}ms`)), ms))]);

async function remotive(search?: string) {
  const url = `https://remotive.com/api/remote-jobs?limit=100${search ? `&search=${encodeURIComponent(search)}` : ""}`;
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Unavailable("Live data temporarily unavailable.");
  const j = (await r.json()) as { jobs?: Array<{ title: string; company_name: string; tags?: string[]; url: string; publication_date: string; candidate_required_location?: string }> };
  return j.jobs || [];
}
const cache = new Map<string, { at: number; value: unknown }>();
async function cached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.value as T;
  const value = await fn(); cache.set(key, { at: Date.now(), value }); return value;
}
const ROLE_KEYS = ["AI", "LLM", "Machine Learning", "ML", "Data Engineer", "Data Scientist", "Full Stack", "Backend", "Frontend", "DevOps", "Product Engineer"];
async function trendingJobs() {
  return cached("trend-jobs", 15 * 60_000, async () => {
    const jobs = await remotive();
    const roles = ROLE_KEYS.map((role) => ({ role, count: jobs.filter((j) => new RegExp(`\\b${role}\\b`, "i").test(j.title)).length })).filter((x) => x.count).sort((a, b) => b.count - a.count);
    const skills = new Map<string, number>();
    jobs.forEach((j) => (j.tags || []).forEach((t) => skills.set(t.toLowerCase(), (skills.get(t.toLowerCase()) || 0) + 1)));
    return { source: "Remotive public API (remote jobs only; a sample, not the whole market)", fetchedAt: new Date().toISOString(), sampleSize: jobs.length, roles, skills: [...skills].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([skill, count]) => ({ skill, count })), jobs: jobs.slice(0, 8).map(({ title, company_name, url, publication_date }) => ({ title, company: company_name, url, published: publication_date })) };
  });
}
export async function youtube(skill: string) {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!key) throw new Unavailable("YouTube search is not configured (set YOUTUBE_API_KEY).");
  return cached(`yt:${skill.toLowerCase()}`, 6 * 3600_000, async () => {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=6&q=${encodeURIComponent(`${skill} tutorial for beginners`)}&key=${encodeURIComponent(key)}`);
    if (!r.ok) throw new Unavailable("YouTube search temporarily unavailable.");
    const j = (await r.json()) as { items?: Array<{ id: { videoId: string }; snippet: { title: string; channelTitle: string } }> };
    return { source: "YouTube Data API", fetchedAt: new Date().toISOString(), videos: (j.items || []).map((i) => ({ id: i.id.videoId, title: i.snippet.title, channel: i.snippet.channelTitle, url: `https://www.youtube.com/watch?v=${i.id.videoId}` })) };
  });
}

type Entry = { id: number; agent: string; task: string; status: "Working" | "Completed" | "Failed"; startedAt: number; endedAt?: number; error?: string };
const activity: Entry[] = []; const runs = new Map<string, number[]>(); let seq = 0;

export async function runAgent(input: unknown) {
  const ctx: Ctx = RunBody.parse(input);
  const agent = agents.find((a) => a.id === ctx.agent);
  if (!agent) throw new Error("Unknown agent.");
  const recent = (runs.get(agent.id) || []).filter((t) => Date.now() - t < 60_000);
  if (recent.length >= agent.perMinute) throw new Error("Rate limit reached for this agent. Try again shortly.");
  runs.set(agent.id, [...recent, Date.now()]);
  const entry: Entry = { id: ++seq, agent: agent.id, task: ctx.task.slice(0, 120), status: "Working", startedAt: Date.now() };
  activity.unshift(entry); activity.length = Math.min(activity.length, 50);
  const exec = async (): Promise<unknown> => {
    if (agent.id === "job-discovery") return { jobs: (await remotive(ctx.profile.targetRole || ctx.task)).slice(0, 10), source: "Remotive public API" };
    if (agent.id === "trending-jobs") return trendingJobs();
    if (agent.id === "trending-courses") return youtube(ctx.profile.missingSkills[0] || ctx.task);
    const p = llm();
    if (!p) throw new Unavailable("AI service temporarily unavailable.");
    return z.string().min(1).max(8000).parse(await p.complete(`Task: ${ctx.task}\nCandidate context (JSON): ${JSON.stringify(ctx.profile)}`, `${agent.system} Use only the context provided. Never invent facts, URLs or qualifications.`));
  };
  try {
    let last: unknown;
    for (let i = 0; i <= agent.retries; i += 1) {
      try { const result = await withTimeout(exec(), agent.timeoutMs); entry.status = "Completed"; entry.endedAt = Date.now(); return { agent: agent.id, result }; }
      catch (e) { last = e; if (e instanceof Unavailable) break; }
    }
    throw last;
  } catch (e) { entry.status = "Failed"; entry.endedAt = Date.now(); entry.error = e instanceof Error ? e.message : "Agent failed."; throw e; }
}

/** Mounted at /api by both the Express server and the Vite dev server. */
export const api = express();
api.use(express.json({ limit: "64kb" }));
const fail = (res: express.Response, e: unknown) => {
  const unavailable = e instanceof Unavailable;
  const msg = e instanceof z.ZodError ? "Invalid request." : e instanceof Error ? e.message : "Request failed.";
  res.status(e instanceof z.ZodError ? 400 : unavailable ? 503 : 502).json({ ok: false, error: msg, unavailable });
};
api.get("/agents", (_q, res) => res.json({ ok: true, llm: llm()?.name ?? null, agents: agents.map(({ system, ...a }) => a) }));
api.get("/agents/activity", (_q, res) => res.json({ ok: true, activity }));
api.post("/agents/run", async (req, res) => { try { res.json({ ok: true, ...(await runAgent(req.body)) }); } catch (e) { fail(res, e); } });
api.get("/trends/jobs", async (_q, res) => { try { res.json({ ok: true, ...(await trendingJobs()) }); } catch (e) { fail(res, e); } });
api.get("/learning/resources", async (req, res) => { try { res.json({ ok: true, ...(await youtube(z.string().trim().min(1).max(60).parse(req.query.skill))) }); } catch (e) { fail(res, e); } });
