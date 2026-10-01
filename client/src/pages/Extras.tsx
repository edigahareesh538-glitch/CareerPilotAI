import { useCallback, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ExternalLink, Loader2, Play, RefreshCw, Sparkles } from "lucide-react";
import { useCareer } from "../contexts/CareerContext";
import { Badge, Button, PageTitle, ProgressBar, ResumeGate, cn } from "./Home";

type Failure = Error & { unavailable?: boolean };
async function call<T>(url: string, body?: unknown): Promise<T> {
  const r = await fetch(url, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined);
  const j = await r.json().catch(() => ({ ok: false, error: "Invalid response" }));
  if (!r.ok || j.ok === false) throw Object.assign(new Error(j.error || "Service unavailable"), { unavailable: !!j.unavailable });
  return j as T;
}
function useRemote<T>(load: () => Promise<T>, auto = true) {
  const [s, set] = useState<{ loading: boolean; data?: T; error?: string; unavailable?: boolean }>({ loading: auto });
  const run = useCallback(() => { set({ loading: true }); load().then((data) => set({ loading: false, data })).catch((e: Failure) => set({ loading: false, error: navigator.onLine ? e.message : "You appear to be offline.", unavailable: e.unavailable })); }, [load]);
  useEffect(() => { if (auto) run(); }, [auto, run]);
  return { ...s, run };
}
function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-[18px] border border-[#ecebf0] bg-white p-5 shadow-[0_5px_18px_rgba(35,35,58,0.035)]", className)}>{children}</div>;
}
function Status({ loading, error, unavailable, retry }: { loading?: boolean; error?: string; unavailable?: boolean; retry: () => void }) {
  if (loading) return <div className="flex items-center gap-2 py-6 text-[12px] text-[#8d8e9d]"><Loader2 className="animate-spin" size={14} /> Loading…</div>;
  if (!error) return null;
  return <div className="rounded-[12px] border border-[#f3d9d6] bg-[#fff8f7] p-4 text-[12px] text-[#a8554e]"><b>{unavailable ? "Unavailable: " : "Error: "}</b>{error}<Button size="sm" variant="secondary" className="ml-3" onClick={retry}><RefreshCw size={12} /> Retry</Button></div>;
}
const slim = (p: ReturnType<typeof useCareer>["profile"]) => ({ targetRole: p.targetRole, skills: p.skills.slice(0, 40), missingSkills: p.missingSkills.slice(0, 15), projects: p.projects.slice(0, 8), experience: p.experience.slice(0, 8), education: p.education.slice(0, 4) });
const runAgent = <T,>(agent: string, task: string, profile: ReturnType<typeof slim>) => call<{ result: T }>("/api/agents/run", { agent, task, profile });

function AgentButton({ agent, task, label }: { agent: string; task: string; label: string }) {
  const { profile } = useCareer();
  const [busy, setBusy] = useState(false); const [out, setOut] = useState(""); const [err, setErr] = useState("");
  const go = () => { setBusy(true); setErr(""); runAgent<string>(agent, task, slim(profile)).then((r) => setOut(r.result)).catch((e: Failure) => setErr(e.message)).finally(() => setBusy(false)); };
  return <div><Button size="sm" variant="soft" onClick={go} disabled={busy}>{busy ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />} {label}</Button>{err && <p className="mt-2 text-[11px] text-[#a8554e]">{err}</p>}{out && <div className="mt-3"><Badge tone="amber">AI-generated · review before relying on it</Badge><pre className="mt-2 whitespace-pre-wrap font-sans text-[12px] leading-5 text-[#555667]">{out}</pre></div>}</div>;
}

type Trend = { source: string; fetchedAt: string; sampleSize: number; roles: { role: string; count: number }[]; skills: { skill: string; count: number }[]; jobs: { title: string; company: string; url: string; published: string }[] };
export function TrendsPage() {
  const s = useRemote(useCallback(() => call<Trend>("/api/trends/jobs"), []));
  const d = s.data; const max = Math.max(1, ...(d?.roles.map((r) => r.count) || [1]));
  return <><PageTitle eyebrow="Career trends" title="What the market is hiring for" description="Computed from a live sample of public remote job posts. Nothing here is hardcoded." action={<Button variant="secondary" onClick={s.run}><RefreshCw size={14} /> Refresh</Button>} />
    <Status {...s} retry={s.run} />
    {d && <><div className="mb-4 flex flex-wrap gap-2 text-[11px] text-[#8d8e9d]"><Badge tone="green" dot>Live</Badge><span>Source: {d.source}</span><span>· Updated {new Date(d.fetchedAt).toLocaleString()} (cached up to 15 min)</span><span>· {d.sampleSize} posts sampled</span></div>
      <div className="grid gap-5 lg:grid-cols-2"><Card><h2 className="mb-4 font-display text-[18px] font-semibold">Roles by posting count</h2>{d.roles.length ? d.roles.map((r) => <div key={r.role} className="mb-3"><div className="mb-1 flex justify-between text-[11px] font-bold text-[#656677]"><span>{r.role}</span><span>{r.count}</span></div><ProgressBar value={(r.count / max) * 100} /></div>) : <p className="text-[12px] text-[#999aa7]">No matching titles in this sample.</p>}</Card>
        <Card><h2 className="mb-4 font-display text-[18px] font-semibold">In-demand skills (tags)</h2><div className="flex flex-wrap gap-2">{d.skills.map((k) => <Badge key={k.skill} tone="violet">{k.skill} · {k.count}</Badge>)}</div></Card></div>
      <Card className="mt-5"><h2 className="mb-3 font-display text-[18px] font-semibold">Recent postings</h2>{d.jobs.map((j) => <a key={j.url} href={j.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between border-b border-[#f0eff3] py-2.5 text-[12px] last:border-0 hover:text-[#6248d8]"><span><b>{j.title}</b> · {j.company}</span><ExternalLink size={13} /></a>)}</Card></>}</>;
}

type Videos = { source: string; fetchedAt: string; videos: { id: string; title: string; channel: string; url: string }[] };
function SkillResources({ skill }: { skill: string }) {
  const s = useRemote(useCallback(() => call<Videos>(`/api/learning/resources?skill=${encodeURIComponent(skill)}`), [skill]), false);
  const [playing, setPlaying] = useState("");
  return <Card><div className="flex items-center justify-between"><div><Badge tone="orange">Skill gap</Badge><h3 className="mt-2 text-[15px] font-bold">{skill}</h3></div><Button size="sm" onClick={s.run} disabled={s.loading}>{s.loading ? <Loader2 className="animate-spin" size={12} /> : <Play size={12} />} Find videos</Button></div>
    {(s.error || s.loading) && <div className="mt-3"><Status {...s} retry={s.run} /></div>}
    {s.data && <><p className="mt-3 text-[10px] text-[#9a9ba8]">{s.data.source} · {new Date(s.data.fetchedAt).toLocaleString()}</p>{playing && <iframe title="YouTube player" className="mt-3 aspect-video w-full rounded-[12px]" src={`https://www.youtube-nocookie.com/embed/${playing}`} allow="encrypted-media; picture-in-picture" allowFullScreen />}
      {s.data.videos.map((v) => <div key={v.id} className="mt-2 flex items-center gap-2 rounded-[10px] bg-[#fafafd] p-2.5 text-[11px]"><div className="min-w-0 flex-1"><div className="truncate font-bold text-[#4a4b5c]">{v.title}</div><div className="text-[#9a9ba8]">{v.channel}</div></div><Button size="sm" variant="soft" onClick={() => setPlaying(v.id)}>Watch</Button><a href={v.url} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-[#8f90a0] hover:text-[#6450d5]" aria-label="Open resource"><ExternalLink size={13} /></a></div>)}</>}
    <div className="mt-4 border-t border-[#f0eff3] pt-4"><AgentButton agent="learning-roadmap" task={`Make a 2-week plan to learn ${skill} with objective, assignment, practice questions and a mock assessment for each week.`} label="Plan + assignments" /></div></Card>;
}
export function CoursesPage() {
  const { profile } = useCareer();
  if (!profile.resumeUpdatedAt) return <ResumeGate eyebrow="Learning" title="Courses are matched to your skill gaps" />;
  return <><PageTitle eyebrow="Trending courses" title="Learn what closes your gaps" description="Videos come from the YouTube Data API (needs YOUTUBE_API_KEY). Plans and assignments come from Gemini and are labelled AI-generated." /><div className="grid gap-5 lg:grid-cols-2">{profile.missingSkills.slice(0, 6).map((k) => <SkillResources key={k} skill={k} />)}</div></>;
}

const BANK: Record<string, { q: string; o: string[]; a: number; hint: string }[]> = {
  Python: [{ q: "Which keyword defines an async function?", o: ["await def", "async def", "def async", "function async"], a: 1, hint: "It precedes def." }, { q: "What does len(set([1,1,2])) return?", o: ["3", "2", "1", "Error"], a: 1, hint: "Sets drop duplicates." }],
  SQL: [{ q: "Which clause filters groups after GROUP BY?", o: ["WHERE", "HAVING", "ORDER BY", "LIMIT"], a: 1, hint: "WHERE runs before grouping." }, { q: "Which JOIN keeps all rows from the left table?", o: ["INNER", "LEFT", "CROSS", "SELF"], a: 1, hint: "Think direction." }],
  FastAPI: [{ q: "FastAPI validates request bodies using…", o: ["Pydantic models", "Jinja2", "Celery", "Alembic"], a: 0, hint: "Type-hint based." }, { q: "Which decorator declares a GET endpoint?", o: ["@app.route", "@app.get", "@get.app", "@endpoint"], a: 1, hint: "Method name." }],
  RAG: [{ q: "What does the retriever do in RAG?", o: ["Trains the LLM", "Finds relevant context to put in the prompt", "Compresses weights", "Hosts the model"], a: 1, hint: "Before generation." }, { q: "Embeddings are compared with…", o: ["Cosine similarity", "Regex", "Hash equality", "Sorting"], a: 0, hint: "Vector distance." }],
};
type Result = { skill: string; score: number; total: number; secs: number; at: number };
const KEY = "careerpilot.challenges.v1";
const load = (): { attempts: number; done: Result[] } => { try { return JSON.parse(localStorage.getItem(KEY) || "") || { attempts: 0, done: [] }; } catch { return { attempts: 0, done: [] }; } };
export function ChallengesPage() {
  const { profile } = useCareer();
  const [state, setState] = useState(load); const [active, setActive] = useState(""); const [idx, setIdx] = useState(0); const [score, setScore] = useState(0); const [t0, setT0] = useState(0); const [hint, setHint] = useState(false); const [period, setPeriod] = useState("Weekly");
  const save = (n: typeof state) => { setState(n); try { localStorage.setItem(KEY, JSON.stringify(n)); } catch { /* storage unavailable */ } };
  if (!profile.resumeUpdatedAt) return <ResumeGate eyebrow="Challenges" title="Challenges are based on your skills" />;
  const skills = Object.keys(BANK).filter((k) => profile.skills.concat(profile.missingSkills).some((s) => s.toLowerCase().includes(k.toLowerCase()))); const shown = skills.length ? skills : Object.keys(BANK);
  const answer = (i: number) => { const q = BANK[active][idx]; const s2 = score + (i === q.a ? 1 : 0); toast[i === q.a ? "success" : "error"](i === q.a ? "Correct" : `Not quite — answer: ${q.o[q.a]}`); setHint(false);
    if (idx + 1 < BANK[active].length) { setIdx(idx + 1); setScore(s2); return; }
    save({ attempts: state.attempts, done: [{ skill: active, score: s2, total: BANK[active].length, secs: Math.round((Date.now() - t0) / 1000), at: Date.now() }, ...state.done].slice(0, 100) }); setActive(""); toast.success(`Challenge complete: ${s2}/${BANK[active].length}`); };
  const days = new Set(state.done.map((d) => new Date(d.at).toDateString())); let streak = 0; for (let d = new Date(); days.has(d.toDateString()); d.setDate(d.getDate() - 1)) streak += 1;
  const win = { Daily: 864e5, Weekly: 7 * 864e5, Monthly: 30 * 864e5 }[period]; const mine = period === "Global" ? [] : state.done.filter((d) => Date.now() - d.at < (win || 0));
  if (active) { const q = BANK[active][idx]; return <Card className="mx-auto max-w-[720px]"><Badge tone="violet">{active} challenge · {idx + 1}/{BANK[active].length}</Badge><h2 className="mt-4 font-display text-[22px] font-semibold">{q.q}</h2><div className="mt-5 space-y-2">{q.o.map((o, i) => <button key={o} onClick={() => answer(i)} className="w-full rounded-[11px] border border-[#ecebf0] p-3 text-left text-[12px] font-semibold hover:bg-[#faf9fd]">{o}</button>)}</div><button className="mt-4 text-[11px] font-bold text-[#715be0]" onClick={() => setHint(true)}>{hint ? q.hint : "Show hint"}</button></Card>; }
  return <><PageTitle eyebrow="Challenges" title="Weekly skill challenges" description="Curated practice questions for your skills. Results are stored in this browser only." />
    <div className="mb-5 grid grid-cols-3 gap-3">{[["Streak (days)", streak], ["Completed", state.done.length], ["Attempts", state.attempts]].map(([l, v]) => <Card key={l as string}><div className="text-[24px] font-bold">{v}</div><div className="text-[11px] text-[#8d8e9d]">{l}</div></Card>)}</div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{shown.map((k) => <Card key={k}><Badge tone="blue">Curated practice</Badge><h3 className="mt-3 text-[14px] font-bold">{k}</h3><p className="text-[10px] text-[#999aa7]">{BANK[k].length} MCQs</p><Button size="sm" className="mt-3 w-full" onClick={() => { save({ ...state, attempts: state.attempts + 1 }); setActive(k); setIdx(0); setScore(0); setT0(Date.now()); }}>Start</Button></Card>)}</div>
    <Card className="mt-5"><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-[18px] font-semibold">Leaderboard</h2><div className="flex gap-1">{["Daily", "Weekly", "Monthly", "Global"].map((p) => <Button key={p} size="sm" variant={p === period ? "soft" : "ghost"} onClick={() => setPeriod(p)}>{p}</Button>)}</div></div>
      {period === "Global" ? <p className="text-[12px] text-[#a8554e]">Unavailable: global rankings need a shared backend, which is not configured. No fake rankings are shown.</p> : <><Badge tone="amber">Local only · just you</Badge><table className="mt-3 w-full text-left text-[12px]"><thead className="text-[10px] uppercase text-[#a5a5b2]"><tr><th>#</th><th>User</th><th>Score</th><th>Challenges</th><th>Streak</th></tr></thead><tbody><tr><td>1</td><td>You</td><td>{mine.reduce((a, d) => a + d.score, 0)}</td><td>{mine.length}</td><td>{streak}</td></tr></tbody></table></>}</Card>
    {state.done.slice(0, 5).map((d) => <div key={d.at} className="mt-2 text-[11px] text-[#777888]">{d.skill}: {d.score}/{d.total} in {d.secs}s · {new Date(d.at).toLocaleDateString()}</div>)}</>;
}

const COMPANIES = ["Google", "Microsoft", "Amazon", "Meta", "NVIDIA", "Infosys", "TCS", "Wipro", "Accenture"];
export function CompanyPrepPage() {
  const { profile } = useCareer(); const [co, setCo] = useState(COMPANIES[0]);
  if (!profile.resumeUpdatedAt) return <ResumeGate eyebrow="Company preparation" title="Upload your resume to tailor preparation" />;
  return <><PageTitle eyebrow="Company preparation" title="Prepare for a specific company" description="Preparation is AI-generated practice. It is not a list of real, current company interview questions." />
    <div className="mb-5 flex flex-wrap gap-2">{COMPANIES.map((c) => <Button key={c} size="sm" variant={c === co ? "primary" : "secondary"} onClick={() => setCo(c)}>{c}</Button>)}</div>
    <div className="grid gap-5 lg:grid-cols-2"><Card><Badge tone="slate">Practice · generic, not company-confirmed</Badge><ul className="mt-3 list-disc space-y-1.5 pl-5 text-[12px] text-[#666778]"><li>Data structures &amp; algorithms (arrays, hash maps, trees, graphs, DP)</li><li>SQL and data modelling</li><li>System design for your target role</li><li>Behavioral stories (STAR) from your projects</li><li>Resume deep-dive on {profile.projects[0] || "your projects"}</li></ul></Card>
      <Card key={co}><AgentButton agent="company-prep" task={`Create an interview preparation plan for ${co} for the ${profile.targetRole} role: topics, 5 practice questions per topic, and a behavioral section. Label as AI-generated practice.`} label={`Generate ${co} plan`} /></Card></div></>;
}

type AgentInfo = { id: string; name: string; permissions: string[]; tools: string[]; timeoutMs: number; retries: number; perMinute: number };
type Act = { id: number; agent: string; task: string; status: string; startedAt: number; error?: string };
export function AgentsPage() {
  const { profile } = useCareer();
  const info = useRemote(useCallback(() => call<{ llm: string | null; agents: AgentInfo[] }>("/api/agents"), []));
  const act = useRemote(useCallback(() => call<{ activity: Act[] }>("/api/agents/activity"), []));
  const [agent, setAgent] = useState("career-coach"); const [task, setTask] = useState(""); const [busy, setBusy] = useState(false); const [out, setOut] = useState("");
  const run = () => { if (!task.trim()) return toast.error("Describe a task first"); setBusy(true); setOut(""); runAgent<unknown>(agent, task, slim(profile)).then((r) => setOut(typeof r.result === "string" ? r.result : JSON.stringify(r.result, null, 2).slice(0, 4000))).catch((e: Failure) => setOut(`${e.unavailable ? "Unavailable: " : "Failed: "}${e.message}`)).finally(() => { setBusy(false); act.run(); }); };
  return <><PageTitle eyebrow="Multi-agent system" title="Agent activity center" description="Requests go through an orchestrator that validates input, enforces rate limits, timeouts and retries, then logs every run. No agent can run shell commands." />
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]"><Card><h2 className="mb-3 font-display text-[18px] font-semibold">Run an agent</h2><Badge tone={info.data?.llm ? "green" : "amber"} dot>{info.data?.llm ? `LLM: ${info.data.llm}` : "LLM not configured — AI agents unavailable"}</Badge>
      <select value={agent} onChange={(e) => setAgent(e.target.value)} className="mt-3 h-10 w-full rounded-[10px] border border-[#e5e4ed] px-3 text-[12px]">{(info.data?.agents || []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
      <textarea value={task} onChange={(e) => setTask(e.target.value)} maxLength={1500} placeholder="e.g. What skills am I missing for an AI Engineer job?" className="mt-3 min-h-[90px] w-full rounded-[10px] border border-[#e5e4ed] p-3 text-[12px] outline-none" />
      <Button className="mt-3" onClick={run} disabled={busy}>{busy ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} Run</Button>{out && <pre className="mt-3 max-h-[320px] overflow-auto whitespace-pre-wrap font-sans text-[12px] leading-5 text-[#555667]">{out}</pre>}</Card>
      <Card><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-[18px] font-semibold">Recent activity</h2><Button size="sm" variant="ghost" onClick={act.run}><RefreshCw size={12} /></Button></div><Status {...act} retry={act.run} />{act.data?.activity.length === 0 && <p className="text-[12px] text-[#999aa7]">No runs yet.</p>}{act.data?.activity.map((a) => <div key={a.id} className="flex items-start gap-2 border-b border-[#f0eff3] py-2 text-[11px] last:border-0"><Badge tone={a.status === "Completed" ? "green" : a.status === "Failed" ? "rose" : "violet"}>{a.status}</Badge><div><b>{a.agent}</b> — {a.task}{a.error && <div className="text-[#a8554e]">{a.error}</div>}</div></div>)}</Card></div>
    <Card className="mt-5"><h2 className="mb-3 font-display text-[18px] font-semibold">Registered agents ({info.data?.agents.length ?? 0})</h2><Status {...info} retry={info.run} /><div className="grid gap-2 md:grid-cols-2">{info.data?.agents.map((a) => <div key={a.id} className="rounded-[10px] bg-[#fafafd] p-3 text-[11px]"><b>{a.name}</b><div className="text-[#9a9ba8]">perms: {a.permissions.join(", ")} · tools: {a.tools.join(", ")} · {a.timeoutMs / 1000}s timeout · {a.retries} retry · {a.perMinute}/min</div></div>)}</div></Card></>;
}
