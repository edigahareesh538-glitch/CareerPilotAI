import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useCareer } from "../contexts/CareerContext";
import { AgentsPage, ChallengesPage, CoursesPage, CompanyPrepPage, TrendsPage } from "./Extras";
import { analyzeResumeText, extractResumeText, scoreJob, type CareerProfile } from "../lib/career-data";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  CloudUpload,
  Code2,
  Copy,
  Download,
  FileText,
  Filter,
  GraduationCap,
  Headphones,
  Heart,
  Home as HomeIcon,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Loader2,
  LockKeyhole,
  Menu,
  MessageCircle,
  Mic,
  MoreHorizontal,
  MoveUpRight,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  Trash2,
  TrendingUp,
  Upload,
  UserRound,
  Video,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Resume", path: "/resume", icon: FileText },
  { label: "Jobs", path: "/jobs", icon: BriefcaseBusiness },
  { label: "Skill gaps", path: "/skill-gaps", icon: Target },
  { label: "Applications", path: "/applications", icon: ClipboardCheck, count: "6" },
  { label: "Interviews", path: "/interviews", icon: Headphones },
  { label: "Assessments", path: "/assessments", icon: GraduationCap },
  { label: "Career AI", path: "/career-ai", icon: Sparkles },
  { label: "Trending", path: "/trending", icon: TrendingUp },
  { label: "Courses", path: "/courses", icon: BookOpen },
  { label: "Challenges", path: "/challenges", icon: Zap },
  { label: "Company prep", path: "/company-prep", icon: BriefcaseBusiness },
  { label: "Agents", path: "/agents", icon: Activity },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
];

const jobs = [
  { id: 1, company: "Vercel", role: "AI Product Engineer", location: "Remote · US / EU", salary: "$155k – $195k", match: 96, tags: ["TypeScript", "LLM APIs", "Next.js"], logo: "V", logoClass: "bg-black text-white", saved: false },
  { id: 2, company: "Google", role: "AI Engineer", location: "Hyderabad · Hybrid", salary: "₹32L – ₹48L", match: 91, tags: ["Python", "Machine Learning", "FastAPI"], logo: "G", logoClass: "bg-[#4285f4] text-white", saved: true },
  { id: 3, company: "Atlan", role: "Machine Learning Engineer", location: "Bengaluru · Remote", salary: "₹28L – ₹42L", match: 87, tags: ["PyTorch", "MLOps", "RAG"], logo: "A", logoClass: "bg-[#6b4eff] text-white", saved: false },
  { id: 4, company: "Microsoft", role: "Software Engineer II, AI", location: "Hyderabad · Hybrid", salary: "₹26L – ₹39L", match: 84, tags: ["Azure", "Python", "Distributed Systems"], logo: "M", logoClass: "bg-[#16a34a] text-white", saved: false },
];

const initialApplications = [
  { id: 1, company: "Vercel", role: "AI Product Engineer", status: "Interview", updated: "Today", tone: "violet", approved: true },
  { id: 2, company: "Google", role: "AI Engineer", status: "Applied", updated: "Yesterday", tone: "blue", approved: true },
  { id: 3, company: "Atlan", role: "Machine Learning Engineer", status: "Screening", updated: "Sep 22", tone: "amber", approved: true },
  { id: 4, company: "Microsoft", role: "Software Engineer II, AI", status: "Saved", updated: "Sep 18", tone: "slate", approved: false },
  { id: 5, company: "OpenAI", role: "Forward Deployed Engineer", status: "Rejected", updated: "Sep 12", tone: "rose", approved: true },
];

const skillGaps = [
  { name: "Retrieval Augmented Generation", short: "RAG", priority: "High", progress: 28, eta: "2 weeks", color: "#7c5cff" },
  { name: "FastAPI & async Python", short: "FastAPI", priority: "High", progress: 42, eta: "10 days", color: "#ef9b62" },
  { name: "Vector databases", short: "Vector DBs", priority: "Medium", progress: 18, eta: "3 weeks", color: "#4ea7a0" },
  { name: "Production MLOps", short: "MLOps", priority: "Medium", progress: 8, eta: "4 weeks", color: "#e5bd4b" },
];

const roadmap = [
  { week: "01", title: "Embeddings & semantic search", duration: "4h 30m", status: "Complete", color: "#7c5cff" },
  { week: "02", title: "Vector databases with pgvector", duration: "5h 10m", status: "In progress", color: "#ef9b62" },
  { week: "03", title: "Retrieval pipelines", duration: "6h 00m", status: "Up next", color: "#4ea7a0" },
  { week: "04", title: "Context construction & evals", duration: "4h 45m", status: "Locked", color: "#c8ccd8" },
];

export function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

async function askGemini(payload: Record<string, unknown>) {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json() as { ok?: boolean; text?: string; error?: string };
  if (!response.ok || !result.ok || !result.text) throw new Error(result.error || "Gemini is unavailable right now.");
  return result.text;
}

function LogoMark() {
  return (
    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#141522] text-white shadow-[0_8px_18px_rgba(20,21,34,0.16)]">
      <Sparkles size={16} strokeWidth={2.4} />
      <span className="absolute bottom-[7px] right-[7px] h-1 w-1 rounded-full bg-[#f1ad82]" />
    </div>
  );
}

export function Button({ children, variant = "primary", size = "md", className, onClick, disabled, type = "button" }: { children: ReactNode; variant?: "primary" | "secondary" | "ghost" | "soft" | "danger"; size?: "sm" | "md" | "lg"; className?: string; onClick?: () => void; disabled?: boolean; type?: "button" | "submit" }) {
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={cn(
      "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold tracking-[-0.01em] transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
      size === "sm" ? "h-8 px-3 text-[12px]" : size === "lg" ? "h-11 px-5 text-[14px]" : "h-9 px-4 text-[13px]",
      variant === "primary" && "bg-[#171827] text-white shadow-[0_5px_14px_rgba(23,24,39,0.16)] hover:bg-[#28293d]",
      variant === "secondary" && "border border-[#e5e4ed] bg-white text-[#292a3b] shadow-sm hover:border-[#d5d2e1] hover:bg-[#fbfbfd]",
      variant === "soft" && "bg-[#f0edff] text-[#6248d8] hover:bg-[#e7e2ff]",
      variant === "ghost" && "text-[#74758a] hover:bg-[#f2f1f8] hover:text-[#2b2c3e]",
      variant === "danger" && "bg-[#fff1f0] text-[#d15850] hover:bg-[#ffe5e3]",
      className,
    )}>{children}</button>
  );
}

export function Badge({ children, tone = "slate", dot = false }: { children: ReactNode; tone?: string; dot?: boolean }) {
  const toneMap: Record<string, string> = {
    violet: "bg-[#f0edff] text-[#674ed8]",
    blue: "bg-[#eaf4ff] text-[#3176bd]",
    amber: "bg-[#fff6df] text-[#af7a22]",
    green: "bg-[#e9f8ee] text-[#2e8d5a]",
    rose: "bg-[#fff0f0] text-[#c85c62]",
    slate: "bg-[#f1f2f6] text-[#74768a]",
    orange: "bg-[#fff0e8] text-[#c57043]",
  };
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold", toneMap[tone] || toneMap.slate)}>{dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}{children}</span>;
}

export function ProgressBar({ value, color = "#7c5cff", height = "h-1.5" }: { value: number; color?: string; height?: string }) {
  return <div className={cn("w-full overflow-hidden rounded-full bg-[#ececf2]", height)}><div className={cn("h-full rounded-full transition-all duration-500", height)} style={{ width: `${value}%`, backgroundColor: color }} /></div>;
}

function StatCard({ label, value, detail, icon: Icon, color, trend }: { label: string; value: string; detail: string; icon: any; color: string; trend?: string }) {
  return <div className="group relative overflow-hidden rounded-[16px] border border-[#ececf0] bg-white p-4 shadow-[0_5px_18px_rgba(35,35,58,0.035)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(35,35,58,0.07)]">
    <div className="flex items-start justify-between"><div className="flex h-8 w-8 items-center justify-center rounded-[10px]" style={{ backgroundColor: `${color}16`, color }}><Icon size={15} /></div>{trend && <span className="flex items-center gap-1 text-[10px] font-bold text-[#29956a]"><TrendingUp size={11} /> {trend}</span>}</div>
    <div className="mt-5 text-[24px] font-bold tracking-[-0.055em] text-[#202132]">{value}</div>
    <div className="mt-1 text-[12px] font-medium text-[#6f7183]">{label}</div>
    <div className="mt-3 text-[10px] font-semibold text-[#a2a3b0]">{detail}</div>
  </div>;
}

export function PageTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#948eac]">{eyebrow || "Workspace"}</div><h1 className="font-display text-[31px] font-semibold leading-none tracking-[-0.06em] text-[#222333]">{title}</h1>{description && <p className="mt-2 max-w-2xl text-[13px] leading-5 text-[#77798c]">{description}</p>}</div>{action}</div>;
}

export function ResumeGate({ eyebrow = "Workspace setup", title = "Start with your resume", description = "Upload your resume once and CareerPilot will populate your profile, matches, applications, skill gaps, and interview room." }: { eyebrow?: string; title?: string; description?: string }) {
  const [, setLocation] = useLocation();
  return <><PageTitle eyebrow={eyebrow} title={title} description={description} /><div className="mx-auto max-w-[720px] rounded-[22px] border border-dashed border-[#d8d1f1] bg-gradient-to-br from-white to-[#faf8ff] p-8 text-center shadow-[0_12px_30px_rgba(51,42,100,0.05)]"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#eeeaff] text-[#715be0]"><CloudUpload size={28} /></div><h2 className="mt-5 font-display text-[23px] font-semibold tracking-[-0.05em] text-[#2d2e40]">Your workspace is ready when you are</h2><p className="mx-auto mt-2 max-w-[470px] text-[12px] leading-5 text-[#858696]">No demo jobs or fake activity are shown here. Add your real resume to generate personalized career data.</p><Button size="lg" className="mt-6" onClick={() => setLocation("/resume")}><Upload size={15} /> Upload resume</Button><div className="mt-4 text-[10px] font-semibold text-[#aaa8b6]">PDF, DOCX, or TXT · up to 10 MB</div></div></>;
}

function Sidebar({ path, navigate, open, onClose }: { path: string; navigate: (path: string) => void; open: boolean; onClose: () => void }) {
  const { profile } = useCareer();
  const initials = profile.name ? profile.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() : "?";
  return <>
    <div className={cn("fixed inset-0 z-30 bg-[#171827]/30 backdrop-blur-[2px] transition-opacity lg:hidden", open ? "opacity-100" : "pointer-events-none opacity-0")} onClick={onClose} />
    <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-[246px] flex-col border-r border-[#ebeaf0] bg-[#fbfbfd] px-4 py-5 transition-transform duration-200 lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
      <div className="mb-8 flex items-center gap-3 px-2"><LogoMark /><div><div className="font-display text-[16px] font-bold tracking-[-0.045em] text-[#202132]">CareerPilot <span className="text-[#7c5cff]">AI</span></div><div className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#a4a4b3]">Career OS · Demo mode</div></div><button className="ml-auto rounded-md p-1 text-[#9a9bab] hover:bg-[#f0eff5] lg:hidden" onClick={onClose}><X size={16} /></button></div>
      <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#b0afbd]">Navigate</div>
      <nav className="space-y-1">{navItems.map(({ label, path: itemPath, icon: Icon, count }) => { const active = itemPath === "/" ? path === "/" : path.startsWith(itemPath); return <button key={itemPath} onClick={() => { navigate(itemPath); onClose(); }} className={cn("group flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[12px] font-semibold transition-colors", active ? "bg-[#eeebff] text-[#674ed8]" : "text-[#797b8c] hover:bg-[#f1f0f6] hover:text-[#353648]")}><Icon size={16} strokeWidth={active ? 2.3 : 1.9} /><span className="flex-1">{label}</span>{count && <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", active ? "bg-white/70 text-[#674ed8]" : "bg-[#efeff3] text-[#9a9aa8]")}>{count}</span>}</button>; })}</nav>
      <div className="my-6 h-px bg-[#ecebf1]" />
      <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#b0afbd]">Manage</div>
      <button onClick={() => { navigate("/settings"); onClose(); }} className={cn("group flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[12px] font-semibold transition-colors", path === "/settings" ? "bg-[#eeebff] text-[#674ed8]" : "text-[#797b8c] hover:bg-[#f1f0f6] hover:text-[#353648]")}><Settings size={16} /><span>Settings</span></button>
      <div className="mt-auto rounded-[15px] border border-[#e5e0ff] bg-[#f4f1ff] p-3.5"><div className="mb-2 flex items-center justify-between"><span className="flex items-center gap-1.5 text-[11px] font-bold text-[#6149ce]"><Sparkles size={12} /> AI Career Agent</span><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#73bd91]" /></div><p className="text-[11px] leading-4 text-[#787099]">Your agent is scanning 18 new roles for you.</p><div className="mt-3"><ProgressBar value={68} color="#7c5cff" /></div><div className="mt-2 flex justify-between text-[9px] font-semibold text-[#9890bd]"><span>Task progress</span><span>68%</span></div></div>
      <div className="mt-5 flex items-center gap-2.5 border-t border-[#ecebf1] pt-4"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f6c1a4] text-[11px] font-bold text-[#6e4330]">{initials}</div><div className="min-w-0"><div className="truncate text-[11px] font-bold text-[#3b3c4c]">{profile.name || "Your profile"}</div><div className="truncate text-[10px] text-[#9a9aa7]">{profile.targetRole ? `${profile.targetRole} track` : "Upload resume to begin"}</div></div><MoreHorizontal className="ml-auto text-[#a2a2b0]" size={15} /></div>
    </aside>
  </>;
}

function Topbar({ onMenu, onCommand }: { onMenu: () => void; onCommand: () => void }) {
  return <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#ecebf1] bg-[#fbfbfd]/90 px-5 backdrop-blur-xl md:px-8"><div className="flex items-center gap-3"><button onClick={onMenu} className="rounded-lg p-2 text-[#656678] hover:bg-[#f0eff5] lg:hidden"><Menu size={19} /></button><div className="hidden items-center gap-2 text-[12px] font-semibold text-[#a3a4af] md:flex"><span>Workspace</span><ChevronRight size={14} /><span className="text-[#505164]">Overview</span></div></div><div className="flex items-center gap-2.5"><button onClick={onCommand} className="hidden h-9 items-center gap-2 rounded-[10px] border border-[#e8e7ed] bg-white px-3 text-[11px] font-semibold text-[#9a9ba8] shadow-sm transition-colors hover:border-[#d8d5e7] md:flex"><Search size={14} /><span>Search anything</span><kbd className="ml-5 rounded bg-[#f3f2f6] px-1.5 py-0.5 font-mono text-[9px] text-[#a3a3b0]">⌘ K</kbd></button><button className="relative rounded-lg p-2 text-[#77798b] hover:bg-[#f0eff5]" onClick={() => toast.info("No new notifications", { description: "Your agent will alert you when a strong match appears." })}><Bell size={17} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#e88d6c] ring-2 ring-[#fbfbfd]" /></button><div className="hidden h-6 w-px bg-[#e7e6ec] sm:block" /><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f6c1a4] text-[10px] font-bold text-[#6e4330]">HS</div></div></header>;
}

function Dashboard({ navigate }: { navigate: (path: string) => void }) {
  const { profile } = useCareer();
  if (!profile.resumeUpdatedAt) return <ResumeGate eyebrow="Career OS setup" title="Build your career cockpit" description="Upload your resume and CareerPilot will automatically create your personalized dashboard from your real experience, skills, and projects." />;
  return <>
    <PageTitle eyebrow="Saturday, September 26, 2026" title={`Good morning, ${profile.name.split(" ")[0]}`} description="Here’s the short version of your career momentum this week." action={<Button onClick={() => navigate("/career-ai")}><Sparkles size={14} /> Ask Career AI</Button>} />
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5"><StatCard label="Career readiness" value={`${profile.readiness}%`} detail="Synced from latest resume" icon={TrendingUp} color="#7c5cff" trend="12%" /><StatCard label="Resume score" value={`${profile.resumeScore}`} detail="ATS compatibility" icon={FileText} color="#ef9b62" trend="4%" /><StatCard label="Skill progress" value={`${profile.skillsScore}%`} detail={`On ${profile.targetRole} path`} icon={Target} color="#4ea7a0" /><StatCard label="Applications" value="24" detail="6 active · 3 this week" icon={ClipboardCheck} color="#e0ad43" /><StatCard label="Job matches" value="17" detail="4 strong matches" icon={BriefcaseBusiness} color="#e47c82" /></div>
    <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
      <div className="rounded-[18px] border border-[#ecebf0] bg-white p-5 shadow-[0_5px_18px_rgba(35,35,58,0.035)]"><div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-[18px] font-semibold tracking-[-0.04em] text-[#292a3b]">Career readiness</h2><p className="mt-1 text-[11px] text-[#9293a2]">A combined view of your job-search momentum.</p></div><button onClick={() => navigate("/analytics")} className="flex items-center gap-1 text-[11px] font-bold text-[#715be0] hover:underline">Full analytics <ArrowRight size={13} /></button></div><div className="grid gap-5 md:grid-cols-[190px_1fr] md:items-center"><div className="relative mx-auto flex h-[166px] w-[166px] items-center justify-center"><div className="absolute inset-0 rounded-full" style={{ background: "conic-gradient(#7c5cff 0 78%, #eeeef3 78% 100%)", mask: "radial-gradient(transparent 0 58%, #000 59%)", WebkitMask: "radial-gradient(transparent 0 58%, #000 59%)" }} /><div className="text-center"><div className="font-display text-[42px] font-semibold tracking-[-0.08em] text-[#252638]">{profile.readiness}</div><div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9a9bab]">out of 100</div></div></div><div className="space-y-4">{[["Resume",profile.resumeScore,"#ef9b62"],["Skills",profile.skillsScore,"#4ea7a0"],["Projects",profile.projectsScore,"#7c5cff"],["Interviews",74,"#e0ad43"],["Learning",79,"#e47c82"]].map(([name,value,color]) => <div key={name as string}><div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold"><span className="text-[#606174]">{name}</span><span className="text-[#303143]">{value}</span></div><ProgressBar value={value as number} color={color as string} /></div>)}</div></div></div>
      <div className="rounded-[18px] bg-[#171827] p-5 text-white shadow-[0_8px_22px_rgba(23,24,39,0.13)]"><div className="mb-6 flex items-center justify-between"><div><div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#a9a4c6]"><Sparkles size={12} /> Agent activity</div><h2 className="font-display text-[18px] font-semibold tracking-[-0.04em]">Your career copilot</h2></div><span className="rounded-full bg-[#70c497]/15 px-2 py-1 text-[9px] font-bold text-[#88d3a8]">LIVE</span></div><div className="space-y-4">{[["Resume analyzed",`ATS score improved to ${profile.resumeScore}`,"done"],["Finding matching jobs","Scanning 42 new roles","active"],["Updating skill roadmap","Next focus: RAG","pending"]].map(([title,sub,status]) => <div className="flex gap-3" key={title}><div className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full", status === "done" ? "bg-[#70c497]/15 text-[#70c497]" : status === "active" ? "bg-[#7c5cff]/20 text-[#a89bff]" : "bg-white/10 text-[#818194]")}>{status === "done" ? <Check size={12} /> : status === "active" ? <Loader2 className="animate-spin" size={12} /> : <Clock3 size={12} />}</div><div><div className="text-[12px] font-bold text-[#f7f6fb]">{title}</div><div className="mt-0.5 text-[10px] text-[#9797aa]">{sub}</div></div></div>)}</div><Button variant="soft" className="mt-7 w-full bg-white/10 text-white hover:bg-white/15" onClick={() => navigate("/career-ai")}>Open agent center <ArrowRight size={13} /></Button></div>
    </div>
    <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
      <div className="rounded-[18px] border border-[#ecebf0] bg-white p-5 shadow-[0_5px_18px_rgba(35,35,58,0.035)]"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-[18px] font-semibold tracking-[-0.04em] text-[#292a3b]">Recommended next actions</h2><p className="mt-1 text-[11px] text-[#9293a2]">Small moves that compound into big progress.</p></div><Badge tone="violet">3 this week</Badge></div><div className="divide-y divide-[#f0eff3]">{[["Improve RAG fundamentals","High-impact skill gap for your target roles","2h 30m","#7c5cff"],["Practice a behavioral interview","Your confidence score can move up fastest","25 min","#ef9b62"],["Apply to 3 strong matches","You have 4 roles above 85% fit","45 min","#4ea7a0"]].map(([title,sub,time,color],i) => <button key={title} onClick={() => toast.success(i === 0 ? "Roadmap opened" : i === 1 ? "Interview prep opened" : "Job matches opened")} className="flex w-full items-center gap-3 py-3.5 text-left transition-colors first:pt-1 last:pb-1 hover:bg-[#fcfbff]"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]" style={{ backgroundColor: `${color}18`, color }}><span className="text-[12px] font-bold">0{i + 1}</span></div><div className="min-w-0 flex-1"><div className="text-[12px] font-bold text-[#434456]">{title}</div><div className="mt-0.5 truncate text-[10px] text-[#9a9ba8]">{sub}</div></div><span className="mr-2 text-[10px] font-bold text-[#9b9caa]">{time}</span><ArrowRight size={14} className="text-[#b2b1bd]" /></button>)}</div></div>
      <div className="rounded-[18px] border border-[#ecebf0] bg-white p-5 shadow-[0_5px_18px_rgba(35,35,58,0.035)]"><div className="mb-4 flex items-start justify-between"><div><h2 className="font-display text-[18px] font-semibold tracking-[-0.04em] text-[#292a3b]">This week</h2><p className="mt-1 text-[11px] text-[#9293a2]">Your activity at a glance.</p></div><Badge tone="green" dot>On track</Badge></div><div className="flex items-end justify-between gap-1 border-b border-[#f0eff3] pb-4 pt-3">{[22,35,30,53,45,68,58].map((v,i) => <div key={i} className="flex flex-1 flex-col items-center gap-2"><div className="flex h-[90px] w-full items-end justify-center"><div className={cn("w-[13px] rounded-t-[5px] transition-all", i === 5 ? "bg-[#7c5cff]" : "bg-[#e8e5ff]")} style={{ height: `${v}%` }} /></div><span className="text-[9px] font-semibold text-[#a7a7b2]">{["M","T","W","T","F","S","S"][i]}</span></div>)}</div><div className="mt-4 grid grid-cols-3 gap-3"><div><div className="text-[20px] font-bold tracking-[-0.05em] text-[#292a3b]">7</div><div className="text-[10px] text-[#999aa8]">Tasks done</div></div><div><div className="text-[20px] font-bold tracking-[-0.05em] text-[#292a3b]">4.2h</div><div className="text-[10px] text-[#999aa8]">Learning time</div></div><div><div className="text-[20px] font-bold tracking-[-0.05em] text-[#292a3b]">+12</div><div className="text-[10px] text-[#999aa8]">Momentum pts</div></div></div></div>
    </div>
  </>;
}

function ResumePage() {
  const { profile, replaceProfile } = useCareer();
  const [file, setFile] = useState<string | null>(profile.resumeUpdatedAt ? profile.resumeFileName : null);
  const [analyzing, setAnalyzing] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState(profile.resumeUpdatedAt ? "Latest uploaded profile is synced across CareerPilot." : "Upload a resume to replace the demo profile.");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (uploaded: File) => {
    setExtracting(true);
    setAnalysisMessage("Extracting contact details, skills, experience, projects, and links…");
    try {
      const text = await extractResumeText(uploaded);
      if (!text.trim()) throw new Error("We could not find readable text in that file.");
      const nextProfile = analyzeResumeText(text, uploaded.name);
      replaceProfile(nextProfile);
      setFile(uploaded.name);
      setAnalysisMessage(`Profile synced from ${uploaded.name}. Dashboard, settings, jobs, and interview context are now updated.`);
      toast.success("Resume uploaded and profile synced", { description: `${nextProfile.name} · ${nextProfile.skills.length} skills detected · ATS ${nextProfile.atsScore}/100` });
    } catch (error) {
      toast.error("Resume upload failed", { description: error instanceof Error ? error.message : "Try a different PDF, DOCX, or TXT file." });
      setAnalysisMessage("Upload a readable PDF, DOCX, or TXT file to update the workspace.");
    } finally {
      setExtracting(false);
    }
  };

  const analyze = () => {
    if (!profile.resumeText) return toast.info("Upload a resume first", { description: "The analysis uses the text extracted from your file." });
    setAnalyzing(true);
    setAnalysisMessage("Re-analyzing your latest resume against your target role…");
    setTimeout(() => {
      const refreshed = analyzeResumeText(profile.resumeText, profile.resumeFileName);
      replaceProfile(refreshed);
      setAnalyzing(false);
      setAnalysisMessage("Analysis refreshed. All connected workspace sections use this profile.");
      toast.success("Resume analysis refreshed", { description: `New score: ${refreshed.resumeScore}/100` });
    }, 750);
  };

  return <><PageTitle eyebrow="Resume intelligence" title="Your resume, made sharper" description="Upload a new version once. CareerPilot extracts the profile and syncs every connected view." action={<Button onClick={() => inputRef.current?.click()} disabled={extracting}><Upload size={14} /> {extracting ? "Extracting…" : "Upload resume"}</Button>} /><input ref={inputRef} aria-label="Upload resume file" type="file" accept=".pdf,.docx,.txt" className="absolute h-px w-px opacity-0" onChange={(e) => { const selected = e.target.files?.[0]; if (selected) void handleUpload(selected); e.target.value = ""; }} />
    <div className="mb-5 flex items-center gap-2 rounded-[12px] border border-[#eeeaff] bg-[#fbfaff] px-3.5 py-3 text-[11px] text-[#716a91]"><Sparkles size={14} className="shrink-0 text-[#715be0]" /><span>{analysisMessage}</span></div>
    <div className="grid gap-5 xl:grid-cols-[1.05fr_1.4fr]">
      <div className="space-y-5"><div className="rounded-[18px] border border-[#ecebf0] bg-white p-5 shadow-[0_5px_18px_rgba(35,35,58,0.035)]"><div className="mb-5 flex items-center justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a1a1af]">Current version</div><h2 className="mt-1 font-display text-[18px] font-semibold tracking-[-0.04em] text-[#292a3b]">{profile.resumeFileName}</h2></div><Badge tone={profile.resumeUpdatedAt ? "green" : "amber"} dot>{profile.resumeUpdatedAt ? "Profile synced" : "Demo profile"}</Badge></div><div className="flex items-center gap-3 rounded-[12px] bg-[#faf9fd] p-3"><div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#fff0e8] text-[#e5895b]"><FileText size={19} /></div><div className="min-w-0 flex-1"><div className="truncate text-[12px] font-bold text-[#494a5a]">{file || "No uploaded file yet"}</div><div className="mt-0.5 text-[10px] text-[#9b9ca9]">{profile.resumeUpdatedAt ? `${profile.skills.length} skills · ${profile.projects.length} projects · updated ${new Date(profile.resumeUpdatedAt).toLocaleDateString()}` : "Upload a PDF, DOCX, or TXT to replace demo data"}</div></div><button onClick={() => toast.info("Resume preview", { description: profile.resumeText ? `${profile.resumeText.slice(0, 160)}…` : "Upload a resume to preview extracted text." })} className="rounded-lg p-2 text-[#8f90a0] hover:bg-white hover:text-[#6450d5]"><ArrowRight size={15} /></button></div><div className="mt-5 flex gap-2"><Button onClick={analyze} disabled={analyzing || !profile.resumeText} className="flex-1">{analyzing ? <><Loader2 className="animate-spin" size={14} /> Analyzing…</> : <><Sparkles size={14} /> Analyze resume</>}</Button><Button variant="secondary" onClick={() => toast.success("Resume download prepared") }><Download size={14} /></Button></div></div><button onClick={() => inputRef.current?.click()} className="group flex w-full flex-col items-center justify-center rounded-[18px] border border-dashed border-[#d9d4ef] bg-[#fbfaff] px-6 py-8 text-center transition-colors hover:border-[#9f90ec] hover:bg-[#f7f4ff]"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#eeeaff] text-[#715be0] transition-transform group-hover:-translate-y-0.5"><CloudUpload size={19} /></div><div className="text-[12px] font-bold text-[#5f51a7]">Drop a new resume here</div><div className="mt-1 text-[10px] text-[#a3a0b6]">PDF, DOCX or TXT · up to 10 MB · replaces the connected profile</div></button><div className="rounded-[18px] border border-[#ecebf0] bg-white p-5 shadow-[0_5px_18px_rgba(35,35,58,0.035)]"><div className="mb-4 flex items-center justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a1a1af]">Extracted profile</div><h2 className="mt-1 font-display text-[18px] font-semibold tracking-[-0.04em] text-[#292a3b]">{profile.name}</h2></div><Badge tone="blue">{profile.targetRole}</Badge></div><div className="grid grid-cols-2 gap-3 text-[11px]"><div><div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#a5a5b2]">Email</div><div className="mt-1 truncate font-semibold text-[#5f6070]">{profile.email}</div></div><div><div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#a5a5b2]">Phone</div><div className="mt-1 truncate font-semibold text-[#5f6070]">{profile.phone}</div></div><div className="col-span-2"><div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#a5a5b2]">Skills detected</div><div className="mt-2 flex flex-wrap gap-1.5">{profile.skills.slice(0, 10).map((skill) => <Badge key={skill} tone="green" dot>{skill}</Badge>)}</div></div></div></div></div>
      <div className="rounded-[18px] border border-[#ecebf0] bg-white p-5 shadow-[0_5px_18px_rgba(35,35,58,0.035)]"><div className="mb-5 flex items-start justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a1a1af]">AI analysis · connected</div><h2 className="mt-1 font-display text-[21px] font-semibold tracking-[-0.05em] text-[#292a3b]">Resume score <span className="text-[#7c5cff]">{profile.resumeScore}</span><span className="text-[13px] text-[#a4a4b0]">/100</span></h2></div><button onClick={analyze} disabled={!profile.resumeText || analyzing} className="rounded-lg p-2 text-[#8e8fa0] hover:bg-[#f5f3fc] hover:text-[#6d56d6] disabled:opacity-40"><RefreshCw size={14} /></button></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["ATS compatibility",profile.atsScore,"#7c5cff"],["Skills",profile.skillsScore,"#4ea7a0"],["Experience",profile.experienceScore,"#ef9b62"],["Keywords",profile.keywordScore,"#e0ad43"]].map(([label,value,color]) => <div key={label as string} className="rounded-[12px] bg-[#fafafd] p-3"><div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg" style={{ color: color as string, backgroundColor: `${color}16` }}><ShieldCheck size={14} /></div><div className="text-[19px] font-bold tracking-[-0.05em] text-[#333446]">{value}</div><div className="mt-0.5 text-[10px] font-semibold text-[#999aa7]">{label}</div><div className="mt-2"><ProgressBar value={value as number} color={color as string} /></div></div>)}</div><div className="mt-6 grid gap-4 md:grid-cols-2"><div><div className="mb-3 flex items-center gap-2 text-[11px] font-bold text-[#3d3e50]"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e9f8ee] text-[#2e8d5a]"><Check size={12} /></span> What’s working</div><ul className="space-y-2 text-[11px] leading-4 text-[#7c7d8c]"><li>{profile.skills.length} relevant skills were detected from your latest file</li><li>{profile.projects.length} project signals are available for job matching</li><li>Your profile is now shared with Settings, Jobs, and Interviews</li></ul></div><div><div className="mb-3 flex items-center gap-2 text-[11px] font-bold text-[#3d3e50]"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#fff0e8] text-[#c57043]"><Lightbulb size={12} /></span> Biggest opportunities</div><ul className="space-y-2 text-[11px] leading-4 text-[#7c7d8c]">{profile.missingSkills.slice(0, 3).map((skill) => <li key={skill}>Add stronger evidence for {skill}</li>)}</ul></div></div><div className="mt-6 rounded-[12px] border border-[#eeeaff] bg-[#fbfaff] p-3.5"><div className="flex items-center gap-2 text-[11px] font-bold text-[#5d4cc1]"><Sparkles size={13} /> Suggested rewrite</div><p className="mt-2 text-[11px] leading-5 text-[#76738f]">{profile.projects[0] ? `Make “${profile.projects[0]}” more specific with a measurable outcome and the tools you used.` : "Upload a resume to generate a profile-specific rewrite."}</p><Button size="sm" variant="soft" className="mt-3" onClick={() => toast.success("Suggestion copied to resume editor")}>Use suggestion <ArrowRight size={12} /></Button></div></div>
    </div></>;
}

function JobsPage() {
  const { profile } = useCareer();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<number[]>([2]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  if (!profile.resumeUpdatedAt) return <ResumeGate eyebrow="Opportunity radar" title="Your matches will appear here" description="Upload your resume to calculate role fit from your actual skills, target role, experience, and projects." />;
  const filtered = jobs.filter((job) => `${job.company} ${job.role} ${job.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const selected = jobs.find((job) => job.id === selectedId) || null;
  const openMatch = (job: (typeof jobs)[number]) => {
    setSelectedId(job.id);
    toast.success("Match analysis opened", { description: `${scoreJob(job, profile)}% fit based on ${profile.skills.length} extracted skills.` });
  };

  return <><PageTitle eyebrow="Opportunity radar" title="Find work that fits" description={`Matches are recalculated from ${profile.name}'s uploaded resume and ${profile.skills.length} detected skills.`} action={<Button onClick={() => toast.success("Job search refreshed", { description: "Scores now use your latest uploaded resume." })}><RefreshCw size={14} /> Refresh matches</Button>} /><div className="mb-5 flex flex-col gap-3 rounded-[16px] border border-[#ecebf0] bg-white p-3 shadow-[0_5px_18px_rgba(35,35,58,0.035)] md:flex-row"><div className="flex h-10 flex-1 items-center gap-2 rounded-[10px] bg-[#f8f8fb] px-3"><Search size={15} className="text-[#9c9dab]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search roles, skills or companies" className="w-full bg-transparent text-[12px] font-medium text-[#393a4b] outline-none placeholder:text-[#aaabb6]" /></div><div className="flex gap-2 overflow-x-auto"><select className="h-10 rounded-[10px] border border-[#e8e7ee] bg-white px-3 text-[11px] font-semibold text-[#6f7081] outline-none"><option>All locations</option><option>Remote</option><option>Hyderabad</option><option>Bengaluru</option></select><select className="h-10 rounded-[10px] border border-[#e8e7ee] bg-white px-3 text-[11px] font-semibold text-[#6f7081] outline-none"><option>All experience</option><option>Entry level</option><option>Mid level</option></select><Button variant="secondary" onClick={() => toast.info("Filters saved", { description: "Your job preferences will be used for future matches." })}><Filter size={14} /> <span className="hidden sm:inline">Filters</span></Button></div></div><div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]"><div className="space-y-3">{filtered.map((job) => { const match = scoreJob(job, profile); return <div key={job.id} className={cn("rounded-[16px] border bg-white p-4 shadow-[0_5px_18px_rgba(35,35,58,0.035)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(35,35,58,0.07)]", selectedId === job.id ? "border-[#a69aee] ring-2 ring-[#eeebff]" : "border-[#ecebf0]")}><div className="flex items-start gap-3"><div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] text-[16px] font-bold", job.logoClass)}>{job.logo}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><div className="text-[10px] font-bold text-[#8b8c99]">{job.company}</div><h3 className="mt-0.5 text-[14px] font-bold tracking-[-0.025em] text-[#38394b]">{job.role}</h3></div><div className="flex flex-col items-end gap-1"><div className="text-[18px] font-bold tracking-[-0.05em] text-[#5d47ca]">{match}%</div><div className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#aaa9b6]">match</div></div></div><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-medium text-[#9697a5]"><span className="flex items-center gap-1"><HomeIcon size={11} /> {job.location}</span><span className="flex items-center gap-1"><BriefcaseBusiness size={11} /> {job.salary}</span></div><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap gap-1.5">{job.tags.map((tag) => <span key={tag} className="rounded-md bg-[#f5f5f9] px-2 py-1 text-[9px] font-semibold text-[#777888]">{tag}</span>)}</div><div className="flex gap-1"><button aria-label={`Save ${job.role}`} onClick={() => { setSaved((current) => current.includes(job.id) ? current.filter((id) => id !== job.id) : [...current, job.id]); toast.success(saved.includes(job.id) ? "Job removed from saved" : "Job saved"); }} className={cn("rounded-lg p-2 transition-colors", saved.includes(job.id) ? "bg-[#fff2e8] text-[#dc895d]" : "text-[#aaaab7] hover:bg-[#f4f3f8] hover:text-[#6f58d2]")}><Heart size={14} fill={saved.includes(job.id) ? "currentColor" : "none"} /></button><Button size="sm" variant="soft" onClick={() => openMatch(job)}>View match <ArrowRight size={12} /></Button></div></div></div></div></div>; })}{filtered.length === 0 && <div className="rounded-[16px] border border-dashed border-[#d8d7e1] bg-white px-6 py-12 text-center"><Search className="mx-auto text-[#b1b0be]" /><div className="mt-3 text-[13px] font-bold text-[#555667]">No roles found</div><p className="mt-1 text-[11px] text-[#999aa7]">Try a broader search or clear your filters.</p></div>}</div><div className="h-fit rounded-[18px] border border-[#ecebf0] bg-white p-5 shadow-[0_5px_18px_rgba(35,35,58,0.035)] xl:sticky xl:top-[88px]">{selected ? <><div className="mb-5 flex items-start justify-between"><div><Badge tone="violet">{scoreJob(selected, profile)}% match</Badge><h2 className="mt-3 font-display text-[22px] font-semibold tracking-[-0.05em] text-[#292a3b]">Why this role fits</h2><p className="mt-1 text-[11px] text-[#9293a2]">{selected.role} · {selected.company} · recalculated now</p></div><button onClick={() => setSelectedId(null)} className="rounded-lg p-1.5 text-[#a3a3b0] hover:bg-[#f3f2f6]"><X size={15} /></button></div><div className="space-y-4"><div><div className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a4a4b1]">Matched skills from resume</div><div className="flex flex-wrap gap-1.5">{selected.tags.map((tag) => <Badge key={tag} tone={profile.skills.some((skill) => skill.toLowerCase() === tag.toLowerCase()) ? "green" : "slate"} dot>{tag}</Badge>)}</div></div><div><div className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a4a4b1]">Gap to close</div><div className="rounded-[10px] bg-[#fffaf3] p-3 text-[11px] leading-4 text-[#8a765d]">Your current target role is <span className="font-bold text-[#a86732]">{profile.targetRole}</span>. The most valuable next skills from this role are {profile.missingSkills.slice(0, 2).join(" and ") || "production scale and system design"}.</div></div><div><div className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a4a4b1]">Reasoning</div><ul className="space-y-2 text-[11px] leading-4 text-[#747585]"><li className="flex gap-2"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-[#5db48a]" />Score uses your latest extracted skills, target role, and location preferences.</li><li className="flex gap-2"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-[#5db48a]" />{profile.projects.length} uploaded project signals are available for alignment.</li><li className="flex gap-2"><Lightbulb size={13} className="mt-0.5 shrink-0 text-[#e3ad45]" />Add evidence for one gap to move this match higher.</li></ul></div></div><div className="mt-6 flex gap-2"><Button className="flex-1" onClick={() => { setLocation("/applications"); toast.success("Application draft created", { description: "Review and approve it from Applications." }); }}>Apply with AI <ArrowRight size={13} /></Button><Button variant="secondary" onClick={() => toast.success("Cover letter generated", { description: "Your tailored draft is ready to edit." })}><FileText size={14} /></Button></div></> : <div className="flex min-h-[330px] flex-col items-center justify-center text-center"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0edff] text-[#735bdd]" onClick={() => filtered[0] && openMatch(filtered[0])}><Target size={21} /></div><h2 className="mt-4 font-display text-[19px] font-semibold tracking-[-0.04em] text-[#373849]">Select a role</h2><p className="mt-2 max-w-[220px] text-[11px] leading-4 text-[#9697a5]">Click “View match” on any job to see exactly why it fits your uploaded profile.</p></div>}</div></div></>;
}

function SkillGapsPage() {
  const { profile } = useCareer();
  const [role, setRole] = useState(profile.targetRole);
  const dynamicGaps = profile.missingSkills.slice(0, 4).map((name, index) => ({ ...skillGaps[index % skillGaps.length], name, short: name.slice(0, 8) }));
  const [completed, setCompleted] = useState<string[]>(["Embeddings & semantic search"]);
  if (!profile.resumeUpdatedAt) return <ResumeGate eyebrow="Skill intelligence" title="Your skill gaps will be personalized here" description="Upload your resume to compare your current skills with your target roles and generate a practical roadmap." />;
  return <><PageTitle eyebrow="Skill intelligence" title="Close the gap to your next role" description="Your profile is already strong. These are the few skills with the biggest upside for AI Engineer roles." action={<select value={role} onChange={(e) => { setRole(e.target.value); toast.success(`Target role changed to ${e.target.value}`); }} className="h-9 rounded-[10px] border border-[#e5e4ed] bg-white px-3 text-[12px] font-bold text-[#515263] outline-none"><option>AI Engineer</option><option>ML Engineer</option><option>Product Engineer</option></select>} /><div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]"><div className="rounded-[18px] border border-[#ecebf0] bg-white p-5 shadow-[0_5px_18px_rgba(35,35,58,0.035)]"><div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-[19px] font-semibold tracking-[-0.045em] text-[#292a3b]">Your skill profile</h2><p className="mt-1 text-[11px] text-[#9495a2]">Compared against {role} demand signals.</p></div><Badge tone="violet">{Math.min(99, profile.skillsScore + 4)}% aligned</Badge></div><div className="mb-5 grid grid-cols-2 gap-3"><div className="rounded-[12px] bg-[#f7f7fb] p-3"><div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#a2a2af]">Current skills</div><div className="mt-2 text-[22px] font-bold tracking-[-0.06em] text-[#343547]">{profile.skills.length}</div><div className="mt-1 text-[10px] text-[#8f90a0]">Verified from resume</div></div><div className="rounded-[12px] bg-[#fbf8ff] p-3"><div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#a2a2af]">Priority gaps</div><div className="mt-2 text-[22px] font-bold tracking-[-0.06em] text-[#6a53ce]">{profile.missingSkills.length}</div><div className="mt-1 text-[10px] text-[#8f90a0]">Worth your next 30 days</div></div></div><div className="mb-2 text-[10px] font-bold uppercase tracking-[0.13em] text-[#a5a5b2]">Priority gaps</div><div className="space-y-2">{dynamicGaps.map((skill) => <div key={skill.name} className="rounded-[12px] border border-[#f0eff3] p-3"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-[9px] text-[10px] font-bold" style={{ backgroundColor: `${skill.color}16`, color: skill.color }}>{skill.short.slice(0,2)}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><div className="truncate text-[11px] font-bold text-[#4a4b5c]">{skill.name}</div><Badge tone={skill.priority === "High" ? "orange" : "amber"}>{skill.priority}</Badge></div><div className="mt-2 flex items-center gap-2"><ProgressBar value={skill.progress} color={skill.color} /><span className="text-[9px] font-bold text-[#9697a5]">{skill.progress}%</span></div></div></div></div>)}</div></div><div className="rounded-[18px] border border-[#ecebf0] bg-white p-5 shadow-[0_5px_18px_rgba(35,35,58,0.035)]"><div className="mb-5 flex items-start justify-between"><div><div className="flex items-center gap-2"><h2 className="font-display text-[19px] font-semibold tracking-[-0.045em] text-[#292a3b]">Your 4-week roadmap</h2><Badge tone="green" dot>Adaptive</Badge></div><p className="mt-1 text-[11px] text-[#9495a2]">Built from your gaps, time, and target role.</p></div><Button size="sm" variant="soft" onClick={() => toast.success("Roadmap regenerated", { description: "The plan now prioritizes FastAPI and RAG." })}><RefreshCw size={12} /> Regenerate</Button></div><div className="space-y-2">{roadmap.map((item) => { const isComplete = completed.includes(item.title); return <div key={item.title} className={cn("flex items-center gap-3 rounded-[13px] border p-3 transition-colors", isComplete ? "border-[#e6f3eb] bg-[#fbfefc]" : "border-[#f0eff3] bg-white")}><button onClick={() => { setCompleted((current) => current.includes(item.title) ? current.filter((x) => x !== item.title) : [...current, item.title]); if (!isComplete) toast.success("Roadmap step complete"); }} className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold", isComplete ? "border-[#9bd2b2] bg-[#e9f8ee] text-[#2e8d5a]" : "border-[#e4e3eb] bg-[#fafafd] text-[#aaaab6]")}>{isComplete ? <Check size={14} /> : item.week}</button><div className="min-w-0 flex-1"><div className={cn("text-[12px] font-bold", isComplete ? "text-[#3b7c59]" : "text-[#4b4c5d]")}>{item.title}</div><div className="mt-1 flex items-center gap-2 text-[10px] text-[#999aa8]"><span className="flex items-center gap-1"><Clock3 size={10} /> {item.duration}</span><span>·</span><span>{item.status}</span></div></div><ChevronRight size={15} className="text-[#b3b2be]" /></div>; })}</div><div className="mt-5 rounded-[12px] bg-[#171827] p-4 text-white"><div className="flex items-center gap-2 text-[11px] font-bold"><Sparkles size={13} className="text-[#b8aaff]" /> Why this order?</div><p className="mt-2 text-[11px] leading-5 text-[#a7a7b9]">RAG is the most common requirement across your top 17 matches. Building a small project this month will improve both your portfolio and your interview confidence.</p></div></div></div></>;
}

function ApplicationsPage() {
  const { profile } = useCareer();
  const [applications, setApplications] = useState(() => profile.resumeUpdatedAt ? initialApplications : []);
  const [showAdd, setShowAdd] = useState(false);
  const [newRole, setNewRole] = useState("");
  if (!profile.resumeUpdatedAt) return <ResumeGate eyebrow="Application tracker" title="Your application pipeline is empty" description="Upload your resume first. CareerPilot will then turn your personalized job matches into an actionable application workspace." />;
  const changeStatus = (id: number) => { const current = applications.find((app) => app.id === id); if (!current) return; const order = ["Saved", "Applied", "Screening", "Interview", "Offer", "Rejected"]; const next = order[(order.indexOf(current.status) + 1) % order.length]; setApplications((apps) => apps.map((app) => app.id === id ? { ...app, status: next } : app)); toast.success(`Status changed to ${next}`); };
  return <><PageTitle eyebrow="Application tracker" title="Keep every opportunity moving" description="A clear view of what’s saved, what’s active, and where to focus next." action={<Button onClick={() => setShowAdd(true)}><Plus size={14} /> Add application</Button>} /><div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><StatCard label="Active applications" value="6" detail="Across 4 companies" icon={Activity} color="#7c5cff" /><StatCard label="Response rate" value="42%" detail="+8% vs last month" icon={TrendingUp} color="#4ea7a0" trend="8%" /><StatCard label="Interviews" value="3" detail="1 this week" icon={CalendarDays} color="#ef9b62" /><StatCard label="Offers" value="0" detail="Keep the pipeline warm" icon={Zap} color="#e0ad43" /></div><div className="overflow-hidden rounded-[18px] border border-[#ecebf0] bg-white shadow-[0_5px_18px_rgba(35,35,58,0.035)]"><div className="flex items-center justify-between border-b border-[#f0eff3] px-5 py-4"><div><h2 className="font-display text-[18px] font-semibold tracking-[-0.04em] text-[#292a3b]">All applications</h2><p className="mt-1 text-[11px] text-[#999aa7]">Sorted by latest activity</p></div><div className="flex items-center gap-2"><Button size="sm" variant="secondary" onClick={() => toast.info("View switched", { description: "Showing all applications." })}><Filter size={12} /> Filter</Button><button onClick={() => toast.info("More views coming", { description: "Try the status filter for now." })} className="rounded-lg p-2 text-[#a1a2af] hover:bg-[#f4f3f8]"><MoreHorizontal size={16} /></button></div></div><div className="hidden grid-cols-[1.35fr_1fr_0.8fr_0.7fr_40px] gap-4 border-b border-[#f3f2f6] bg-[#fcfcfd] px-5 py-3 text-[9px] font-bold uppercase tracking-[0.12em] text-[#a6a6b2] md:grid"><span>Role</span><span>Status</span><span>Last activity</span><span>Approval</span><span /></div><div className="divide-y divide-[#f0eff3]">{applications.map((app) => <div key={app.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.35fr_1fr_0.8fr_0.7fr_40px] md:items-center md:gap-4"><div className="flex items-center gap-3"><div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[11px] font-bold", app.company === "Vercel" ? "bg-black text-white" : app.company === "Google" ? "bg-[#eaf2ff] text-[#4285f4]" : "bg-[#f0edff] text-[#674ed8]")}>{app.company.slice(0,1)}</div><div><div className="text-[12px] font-bold text-[#444556]">{app.role}</div><div className="mt-0.5 text-[10px] text-[#999aa7]">{app.company}</div></div></div><div><button onClick={() => changeStatus(app.id)}><Badge tone={app.tone} dot>{app.status}</Badge></button></div><div className="text-[11px] font-medium text-[#858695]">{app.updated}</div><div>{app.approved ? <Badge tone="green" dot>Approved</Badge> : <Button size="sm" variant="soft" onClick={() => { setApplications((apps) => apps.map((x) => x.id === app.id ? { ...x, approved: true, status: "Applied" } : x)); toast.success("Application approved", { description: "Your application is now active." }); }}>Approve</Button>}</div><button onClick={() => { setApplications((apps) => apps.filter((x) => x.id !== app.id)); toast.success("Application removed"); }} className="hidden rounded-lg p-2 text-[#b4b4c0] hover:bg-[#fff0f0] hover:text-[#d15850] md:block"><Trash2 size={14} /></button></div>)}</div></div>{showAdd && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171827]/30 p-4 backdrop-blur-sm"><div className="w-full max-w-[420px] rounded-[18px] bg-white p-5 shadow-2xl"><div className="flex items-start justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#a5a5b2]">New opportunity</div><h2 className="mt-1 font-display text-[21px] font-semibold tracking-[-0.05em] text-[#292a3b]">Add an application</h2></div><button onClick={() => setShowAdd(false)} className="rounded-lg p-1.5 text-[#a0a0ae] hover:bg-[#f3f2f6]"><X size={15} /></button></div><label className="mt-6 block text-[11px] font-bold text-[#5e5f70]">Role title<input autoFocus value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="e.g. Product Engineer" className="mt-2 h-10 w-full rounded-[10px] border border-[#e5e4ed] px-3 text-[12px] outline-none focus:border-[#9e91ea]" /></label><label className="mt-4 block text-[11px] font-bold text-[#5e5f70]">Company<input placeholder="e.g. Acme" className="mt-2 h-10 w-full rounded-[10px] border border-[#e5e4ed] px-3 text-[12px] outline-none focus:border-[#9e91ea]" /></label><div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button><Button onClick={() => { if (!newRole.trim()) return toast.error("Add a role title first"); setApplications((apps) => [{ id: Date.now(), company: "New company", role: newRole, status: "Saved", updated: "Just now", tone: "slate", approved: false }, ...apps]); setNewRole(""); setShowAdd(false); toast.success("Application saved"); }}>Save application</Button></div></div></div>}</>;
}

function InterviewsPage({ navigate }: { navigate: (path: string) => void }) {
  const { profile } = useCareer();
  if (!profile.resumeUpdatedAt) return <ResumeGate eyebrow="Interview studio" title="Your interview room starts with your resume" description="Upload your resume and Ari will create role-specific questions from your actual experience, skills, and projects." />;
  return <><PageTitle eyebrow="Interview studio" title="Build confidence before the room" description="Practice with an adaptive AI interviewer that follows up on your answers instead of reading a script." action={<Button onClick={() => navigate("/interviews/new")}><Plus size={14} /> New interview</Button>} /><div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]"><div className="rounded-[18px] bg-[#171827] p-6 text-white shadow-[0_10px_26px_rgba(23,24,39,0.14)]"><div className="flex items-start justify-between"><div><Badge tone="violet">AI interviewer</Badge><h2 className="mt-4 max-w-[360px] font-display text-[28px] font-semibold leading-[1.03] tracking-[-0.065em]">Practice the answer, not the anxiety.</h2><p className="mt-3 max-w-[380px] text-[12px] leading-5 text-[#a6a6b9]">Get realistic role-specific questions, thoughtful follow-ups, and feedback you can use right away.</p></div><div className="hidden h-20 w-20 items-center justify-center rounded-full border border-[#7c5cff]/30 bg-[#7c5cff]/10 text-[#b6aaff] sm:flex"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#7c5cff]/20"><Mic size={22} /></div></div></div><div className="mt-8 grid grid-cols-3 gap-2 border-t border-white/10 pt-5"><div><div className="text-[21px] font-bold tracking-[-0.05em]">8</div><div className="mt-1 text-[10px] text-[#9797aa]">Sessions</div></div><div><div className="text-[21px] font-bold tracking-[-0.05em]">74</div><div className="mt-1 text-[10px] text-[#9797aa]">Avg. score</div></div><div><div className="text-[21px] font-bold tracking-[-0.05em]">+18%</div><div className="mt-1 text-[10px] text-[#9797aa]">This month</div></div></div></div><div className="rounded-[18px] border border-[#ecebf0] bg-white p-5 shadow-[0_5px_18px_rgba(35,35,58,0.035)]"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-display text-[18px] font-semibold tracking-[-0.04em] text-[#292a3b]">Recent feedback</h2><p className="mt-1 text-[11px] text-[#999aa7]">Your last three sessions</p></div><button onClick={() => toast.info("Showing all interview sessions")} className="text-[11px] font-bold text-[#715be0]">View all</button></div><div className="space-y-3">{[["Technical · AI Engineer","Sep 24","82","green"],["Behavioral · AI Engineer","Sep 19","74","violet"],["Mixed · Software Engineer","Sep 12","66","amber"]].map(([title,date,score,tone]) => <button key={title} onClick={() => toast.success("Feedback opened", { description: `Session score: ${score}/100` })} className="flex w-full items-center gap-3 rounded-[12px] border border-[#f0eff3] p-3 text-left hover:bg-[#fcfbff]"><div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#f5f3ff] text-[#735bdd]"><Headphones size={14} /></div><div className="min-w-0 flex-1"><div className="truncate text-[11px] font-bold text-[#555667]">{title}</div><div className="mt-1 text-[10px] text-[#a0a1ad]">{date}</div></div><Badge tone={tone}>{score}/100</Badge><ChevronRight size={14} className="text-[#b4b3bf]" /></button>)}</div></div></div><div className="mt-5 rounded-[18px] border border-[#ecebf0] bg-white p-5 shadow-[0_5px_18px_rgba(35,35,58,0.035)]"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-[18px] font-semibold tracking-[-0.04em] text-[#292a3b]">Interview toolkit</h2><p className="mt-1 text-[11px] text-[#999aa7]">Focused practice, not endless prep.</p></div></div><div className="grid gap-3 md:grid-cols-3">{[["Technical drills","Sharpen core concepts with follow-up questions.",Code2,"#7c5cff"],["Behavioral stories","Turn your projects into clear STAR answers.",MessageCircle,"#ef9b62"],["Voice practice","Get comfortable thinking out loud.",Mic,"#4ea7a0"]].map(([title,desc,Icon,color]) => <button key={title as string} onClick={() => navigate("/interviews/new")} className="rounded-[13px] border border-[#f0eff3] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#dcd8f2] hover:shadow-sm"><div className="mb-4 flex h-8 w-8 items-center justify-center rounded-[9px]" style={{ backgroundColor: `${color}18`, color: color as string }}>{typeof Icon === "function" && <Icon size={15} />}</div><div className="text-[12px] font-bold text-[#48495a]">{title as string}</div><div className="mt-1 text-[10px] leading-4 text-[#9697a5]">{desc as string}</div></button>)}</div></div></>;
}

function NewInterview({ navigate }: { navigate: (path: string) => void }) {
  const { profile } = useCareer();
  const [type, setType] = useState("Technical");
  const [targetRole, setTargetRole] = useState(profile.targetRole);
  const [difficulty, setDifficulty] = useState("Medium");
  const [starting, setStarting] = useState(false);
  if (!profile.resumeUpdatedAt) return <ResumeGate eyebrow="Interview setup" title="Upload your resume before starting practice" description="Ari uses your real resume details to ask relevant questions and give useful follow-ups." />;
  const start = () => { setStarting(true); setTimeout(() => { navigate(`/interviews/room/${Date.now()}?type=${encodeURIComponent(type)}&difficulty=${encodeURIComponent(difficulty)}`); }, 700); };
  return <div className="mx-auto max-w-[900px]"><button onClick={() => navigate("/interviews")} className="mb-6 flex items-center gap-1.5 text-[11px] font-bold text-[#8d8e9d] hover:text-[#6250cd]"><ChevronLeft size={14} /> Back to interviews</button><PageTitle eyebrow="Interview setup" title="Design your practice room" description={`Practice for ${targetRole} using the skills and project context from your latest resume.`} /><div className="grid gap-5 md:grid-cols-[1.25fr_0.75fr]"><div className="rounded-[18px] border border-[#ecebf0] bg-white p-5 shadow-[0_5px_18px_rgba(35,35,58,0.035)]"><div className="space-y-6"><div><div className="mb-3 text-[11px] font-bold text-[#535465]">Interview type</div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{["Technical","Behavioral","HR","Mixed"].map((item) => <button key={item} onClick={() => setType(item)} className={cn("rounded-[11px] border px-3 py-3 text-[11px] font-bold transition-colors", type === item ? "border-[#b9adf1] bg-[#f2efff] text-[#6650d2]" : "border-[#ecebf0] text-[#888996] hover:bg-[#faf9fd]")}>{item}</button>)}</div></div><div><div className="mb-3 text-[11px] font-bold text-[#535465]">Target role</div><div className="relative"><select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="h-11 w-full appearance-none rounded-[10px] border border-[#e5e4ed] bg-white px-3 text-[12px] font-semibold text-[#545566] outline-none"><option>{profile.targetRole}</option><option>AI Engineer</option><option>Machine Learning Engineer</option><option>Product Engineer</option></select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 text-[#9e9eab]" size={15} /></div></div><div><div className="mb-3 text-[11px] font-bold text-[#535465]">Difficulty</div><div className="flex gap-2">{["Easy","Medium","Hard"].map((item) => <button key={item} onClick={() => setDifficulty(item)} className={cn("rounded-[10px] border px-5 py-2.5 text-[11px] font-bold transition-colors", difficulty === item ? "border-[#b9adf1] bg-[#f2efff] text-[#6650d2]" : "border-[#ecebf0] text-[#888996] hover:bg-[#faf9fd]")}>{item}</button>)}</div></div><div className="flex items-center gap-3 rounded-[12px] bg-[#fbfaff] p-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eeeaff] text-[#715be0]"><Sparkles size={14} /></div><div><div className="text-[11px] font-bold text-[#56576a]">Adaptive follow-ups enabled</div><div className="mt-0.5 text-[10px] text-[#9997ac]">Questions use {profile.skills.slice(0, 3).join(", ")} and your latest project context.</div></div></div><Button size="lg" className="w-full" onClick={start} disabled={starting}>{starting ? <><Loader2 className="animate-spin" size={15} /> Creating your room…</> : <><Play size={15} /> Start interview</>}</Button></div></div><div className="rounded-[18px] bg-[#171827] p-5 text-white"><div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#aaa6c4]"><ShieldCheck size={13} /> Session preview</div><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#7c5cff]/20 text-[#b7abff]"><Sparkles size={21} /></div><div><div className="text-[13px] font-bold">Ari</div><div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#8e8ea1]"><span className="h-1.5 w-1.5 rounded-full bg-[#79c99a]" /> Ready to interview {profile.name.split(" ")[0]}</div></div></div><div className="mt-8 space-y-3 border-t border-white/10 pt-5">{[["Focus",type],["Role",targetRole],["Level",difficulty],["Length","20–25 min"]].map(([label,value]) => <div key={label} className="flex items-center justify-between text-[11px]"><span className="text-[#8f8fa2]">{label}</span><span className="font-semibold text-[#f7f6fb]">{value}</span></div>)}</div><p className="mt-8 text-[10px] leading-4 text-[#8f8fa2]">Microphone and camera are optional. The room now requests device permission and keeps text fallback available.</p></div></div></div>;
}

function InterviewRoom({ navigate }: { navigate: (path: string) => void }) {
  const { profile } = useCareer();
  const [paused, setPaused] = useState(false);
  const [answer, setAnswer] = useState("");
  const [interim, setInterim] = useState("");
  const [question, setQuestion] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [micError, setMicError] = useState("");
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiQuestionLoading, setAiQuestionLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const voiceActiveRef = useRef(false);

  const interviewType = useMemo(() => new URLSearchParams(window.location.search).get("type") || "Technical", []);
  const difficulty = useMemo(() => new URLSearchParams(window.location.search).get("difficulty") || "Medium", []);
  const questionText = (number: number) => number === question && aiQuestion
    ? aiQuestion
    : number === 1
    ? `Hi ${profile.name.split(" ")[0]}. Can you explain what a REST API is and how you would design one for a ${profile.targetRole.toLowerCase()} application system?`
    : number === 2
      ? "That's a good foundation. How would you handle authentication and authorization in that system?"
      : `Imagine traffic grows 10× overnight. What would you monitor first in your ${profile.projects[0] || "latest project"}, and which trade-offs would you consider?`;

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.94;
    utterance.pitch = 0.86;
    utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((voice) => /en-US|en-GB/i.test(voice.lang) && /Google|Microsoft|Samantha|Daniel/i.test(voice.name)) || voices.find((voice) => /en/i.test(voice.lang));
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => setAiSpeaking(true);
    utterance.onend = () => setAiSpeaking(false);
    utterance.onerror = () => setAiSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopRecognition = () => {
    voiceActiveRef.current = false;
    recognitionRef.current?.stop?.();
    recognitionRef.current = null;
    setMicOn(false);
  };

  const startRecognition = (): boolean => {
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      setMicError("Live transcription is not supported in this browser. You can still type your answer.");
      toast.info("Speech-to-text is unavailable", { description: "Try Chrome or Edge, or use the text answer box." });
      return false;
    }
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onstart = () => { voiceActiveRef.current = true; setMicOn(true); setMicError(""); };
    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      if (finalText) setAnswer((current) => `${current}${current && !current.endsWith(" ") ? " " : ""}${finalText}`.trim());
      setInterim(interimText);
    };
    recognition.onerror = (event: any) => {
      voiceActiveRef.current = false;
      setMicOn(false);
      setMicError(event.error === "not-allowed" ? "Microphone permission was blocked. Enable it in site settings or type your answer." : `Speech recognition stopped: ${event.error || "unknown error"}.`);
    };
    recognition.onend = () => {
      setInterim("");
      recognitionRef.current = null;
      if (voiceActiveRef.current) setMicOn(false);
    };
    recognitionRef.current = recognition;
    try { recognition.start(); return true; } catch { setMicError("Speech recognition could not start. Please try again or type your answer."); return false; }
  };

  const toggleMic = async () => {
    if (micOn || recognitionRef.current) { stopRecognition(); micStream?.getTracks().forEach((track) => track.stop()); setMicStream(null); toast.info("Microphone paused"); return; }
    if (!navigator.mediaDevices?.getUserMedia) { startRecognition(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(stream);
      const started = startRecognition();
      if (started) toast.success("Microphone enabled", { description: "Your speech will be transcribed into the answer box." });
      else { stream.getTracks().forEach((track) => track.stop()); setMicStream(null); }
    } catch {
      setMicError("Microphone permission was blocked. Enable it in site settings or type your answer.");
      startRecognition();
    }
  };

  const toggleCamera = async () => {
    if (cameraOn) { cameraStream?.getTracks().forEach((track) => track.stop()); setCameraStream(null); setCameraOn(false); if (videoRef.current) videoRef.current.srcObject = null; toast.info("Camera turned off"); return; }
    if (!navigator.mediaDevices?.getUserMedia) { setMicError("Camera is not available in this browser; the AI video panel remains available."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraStream(stream); setCameraOn(true);
      toast.success("Camera enabled", { description: "Your video preview is now visible in the interview room." });
    } catch { setMicError("Camera permission was blocked. You can continue with the AI video panel and text answers."); toast.info("Camera is optional"); }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !cameraStream || !cameraOn) return;
    video.muted = true;
    video.playsInline = true;
    video.srcObject = cameraStream;
    void video.play().catch(() => {
      setMicError("Camera is enabled, but the preview needs one more click to play. Use the Enable camera button again if it stays blank.");
    });
    return () => {
      if (video.srcObject === cameraStream) video.srcObject = null;
    };
  }, [cameraStream, cameraOn]);

  useEffect(() => {
    const timeout = window.setTimeout(() => speak(questionText(question)), 450);
    return () => { window.clearTimeout(timeout); window.speechSynthesis?.cancel(); stopRecognition(); micStream?.getTracks().forEach((track) => track.stop()); cameraStream?.getTracks().forEach((track) => track.stop()); };
  }, [question]);

  useEffect(() => {
    let cancelled = false;
    setAiQuestionLoading(true);
    void askGemini({ action: "interview", profile, interviewType, difficulty })
      .then((text) => { if (!cancelled) { setAiQuestion(text); speak(text); } })
      .catch(() => { if (!cancelled) setAiQuestion(""); })
      .finally(() => { if (!cancelled) setAiQuestionLoading(false); });
    return () => { cancelled = true; };
  }, [question, profile.resumeUpdatedAt, profile.targetRole, interviewType, difficulty]);

  if (!profile.resumeUpdatedAt) return <ResumeGate eyebrow="Interview room" title="Upload your resume before entering the room" description="Ari needs your real profile context to ask relevant questions and evaluate your answers." />;

  const sendAnswer = () => {
    if (!answer.trim()) return toast.error("Speak or type a short answer first");
    stopRecognition();
    setSubmitted(true);
    window.speechSynthesis?.cancel();
    window.setTimeout(() => {
      const next = Math.min(3, question + 1);
      setQuestion(next);
      setAnswer("");
      setInterim("");
      setSubmitted(false);
      speak(questionText(next));
    }, 850);
  };

  return <div className="-m-5 min-h-[calc(100vh-68px)] bg-[#11121e] p-5 text-white md:-m-8 md:p-8"><div className="mx-auto max-w-[1240px]"><div className="mb-5 flex items-center justify-between"><button onClick={() => navigate("/interviews")} className="flex items-center gap-1.5 text-[11px] font-bold text-[#a3a3b5] hover:text-white"><ChevronLeft size={14} /> Exit room</button><div className="flex items-center gap-2"><Badge tone="green" dot>{aiSpeaking ? "Ari is speaking" : paused ? "Paused" : "In progress"}</Badge><span className="hidden text-[10px] text-[#858598] sm:inline">{micOn ? "Voice transcription live" : "Text fallback ready"}</span></div></div><div className="grid gap-5 xl:grid-cols-[1fr_380px]"><div className="flex min-h-[650px] flex-col rounded-[18px] border border-white/10 bg-[#181927] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] md:p-7"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9696aa]"><Headphones size={13} className="text-[#a89bff]" /> Ari · AI interviewer</div><div className="flex items-center gap-1.5 text-[11px] font-mono text-[#a9a9ba]"><Timer size={13} /> 12:48</div></div><div className="flex flex-1 flex-col items-center justify-center px-3 text-center"><div className={cn("relative flex h-32 w-32 items-center justify-center rounded-full border border-[#7c5cff]/40 bg-[#7c5cff]/10", aiSpeaking ? "animate-[pulse_1s_ease-in-out_infinite]" : paused ? "" : "animate-[pulse_2.5s_ease-in-out_infinite]")}><div className="absolute inset-3 rounded-full border border-[#a899ff]/20" /><div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#7c5cff]/20 text-[#bdb4ff]"><Sparkles size={30} /></div></div><div className="mt-7 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8e8ea0]">Question {question} of 3 · {aiQuestionLoading ? "Ari is preparing a Gemini question…" : "AI-generated"}</div><h1 className="mt-4 max-w-[640px] font-display text-[27px] font-semibold leading-[1.1] tracking-[-0.055em] text-[#f8f7fb]">{questionText(question)}</h1><p className="mt-4 max-w-[470px] text-[11px] leading-5 text-[#9292a5]">Ari asks in voice and text. Speak naturally and watch your words appear live below.</p></div><div className="rounded-[13px] border border-white/10 bg-white/[0.03] p-3"><textarea value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={paused || submitted} placeholder="Your spoken or typed answer appears here…" className="min-h-[74px] w-full resize-none bg-transparent text-[12px] leading-5 text-[#ecebf4] outline-none placeholder:text-[#747487]" />{interim && <div className="mt-2 rounded-lg bg-[#7c5cff]/10 px-2 py-1.5 text-left text-[11px] italic text-[#bdb4ff]">Listening: {interim}</div>}{micError && <div className="mt-2 text-left text-[10px] leading-4 text-[#efb0a8]">{micError}</div>}<div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2"><div className="flex gap-1"><button aria-label={micOn ? "Stop voice transcription" : "Start voice transcription"} onClick={() => void toggleMic()} className={cn("rounded-lg p-2 hover:bg-white/10 hover:text-white", micOn ? "bg-[#70c497]/15 text-[#86d6a6]" : "text-[#858598]")}>{micOn ? <Volume2 size={14} /> : <Mic size={14} />}</button><button aria-label={cameraOn ? "Turn camera off" : "Enable camera"} onClick={() => void toggleCamera()} className={cn("rounded-lg p-2 hover:bg-white/10 hover:text-white", cameraOn ? "bg-[#70c497]/15 text-[#86d6a6]" : "text-[#858598]")}><Video size={14} /></button><button aria-label={aiSpeaking ? "Stop AI voice" : "Replay AI question"} onClick={() => aiSpeaking ? window.speechSynthesis.cancel() : speak(questionText(question))} className="rounded-lg p-2 text-[#858598] hover:bg-white/10 hover:text-white">{aiSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}</button></div><Button size="sm" onClick={sendAnswer} disabled={paused || submitted}>{submitted ? <><Loader2 className="animate-spin" size={13} /> Analyzing…</> : <>Send answer <Send size={12} /></>}</Button></div></div></div><div className="space-y-5"><div className="relative overflow-hidden rounded-[18px] border border-white/10 bg-[#202133] p-3"><div className="mb-3 flex items-center justify-between px-1"><div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a7a4bd]">Video interview</div><Badge tone={cameraOn ? "green" : "slate"} dot>{cameraOn ? "Camera live" : "Preview ready"}</Badge></div><div className="relative aspect-video overflow-hidden rounded-[13px] bg-gradient-to-br from-[#2e275e] via-[#211f3d] to-[#141521]">{cameraOn ? <video ref={videoRef} autoPlay muted playsInline className="h-full w-full scale-x-[-1] object-cover" /> : <><div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 50% 40%, #a894ff 0 2px, transparent 3px), radial-gradient(circle at 15% 20%, #ffffff 0 1px, transparent 2px)", backgroundSize: "42px 42px, 68px 68px" }} /><div className="absolute inset-0 flex flex-col items-center justify-center"><div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#a89bff]/35 bg-[#7c5cff]/20 text-[#d0c9ff] shadow-[0_0_35px_rgba(124,92,255,0.25)]"><Sparkles size={29} /></div><div className="mt-3 text-[12px] font-bold text-white">Ari</div><div className="mt-1 text-[10px] text-[#bab6d0]">AI interviewer · voice + text</div></div></>}</div><div className="mt-3 flex items-center justify-between text-[10px] text-[#a4a4b8]"><span>{cameraOn ? "Your camera preview is live" : "Enable camera for a real-time preview"}</span><button onClick={() => void toggleCamera()} className="font-bold text-[#bcb2ff] hover:text-white">{cameraOn ? "Turn off" : "Enable"}</button></div></div><div className="rounded-[18px] border border-white/10 bg-[#181927] p-5"><div className="flex items-center justify-between"><div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9595a8]">Session details</div><button aria-label={paused ? "Resume interview" : "Pause interview"} onClick={() => setPaused(!paused)} className="rounded-lg p-2 text-[#9191a4] hover:bg-white/10 hover:text-white">{paused ? <Play size={14} /> : <Pause size={14} />}</button></div><div className="mt-5 space-y-3 border-b border-white/10 pb-5">{[["Role",profile.targetRole],["Type","Technical"],["Difficulty","Medium"],["Progress",`${Math.round((question / 3) * 100)}%`]].map(([label,value]) => <div key={label} className="flex items-center justify-between text-[11px]"><span className="text-[#88889a]">{label}</span><span className="font-semibold text-[#eeeef5]">{value}</span></div>)}</div><div className="mt-5"><div className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9595a8]">Device status</div><div className="space-y-2 text-[11px]"><div className="flex items-center justify-between"><span className="text-[#88889a]">Voice transcription</span><Badge tone={micOn ? "green" : "slate"} dot>{micOn ? "Listening" : "Off"}</Badge></div><div className="flex items-center justify-between"><span className="text-[#88889a]">Camera</span><Badge tone={cameraOn ? "green" : "slate"} dot>{cameraOn ? "Live" : "Optional"}</Badge></div><div className="flex items-center justify-between"><span className="text-[#88889a]">AI voice</span><Badge tone={aiSpeaking ? "green" : "violet"} dot>{aiSpeaking ? "Speaking" : "Ready"}</Badge></div></div></div><div className="mt-5"><div className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9595a8]">Conversation</div><div className="space-y-3 text-[11px] leading-4"><div className="flex gap-2"><div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#a89bff]" /><div className="text-[#aaaabd]">Ari asks every question in voice and text, and adapts to your spoken answer.</div></div>{question > 1 && <div className="flex gap-2"><div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#70c497]" /><div className="text-[#aaaabd]">Good start. I’m going to probe one level deeper.</div></div>}</div></div><div className="mt-7"><Button variant="danger" className="w-full bg-[#d15850]/15 text-[#ef9b96] hover:bg-[#d15850]/25" onClick={() => { stopRecognition(); window.speechSynthesis?.cancel(); micStream?.getTracks().forEach((track) => track.stop()); cameraStream?.getTracks().forEach((track) => track.stop()); navigate("/interviews"); toast.success("Interview ended", { description: "Feedback is ready in your interview history." }); }}><X size={14} /> End interview</Button></div></div></div></div></div></div>;
}

function AssessmentsPage() {
  const { profile } = useCareer();
  const [active, setActive] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const questions = ["Which HTTP method is idempotent and typically used to replace a resource?", "What is the main benefit of using a vector database in an RAG system?", "Which Python feature is commonly used to handle asynchronous I/O?"];
  if (!profile.resumeUpdatedAt) return <ResumeGate eyebrow="Practice lab" title="Your assessments will be personalized after upload" description="Upload your resume to unlock role-relevant practice tracks and progress insights." />;
  if (active) return <><PageTitle eyebrow="Assessment room" title={active} description="Answer at your own pace. Your score and topic breakdown will appear after submission." action={<Badge tone="amber" dot>18:42 left</Badge>} /><div className="mx-auto max-w-[760px] rounded-[18px] border border-[#ecebf0] bg-white p-5 shadow-[0_5px_18px_rgba(35,35,58,0.035)] md:p-7"><div className="mb-6 flex items-center justify-between"><span className="text-[11px] font-bold text-[#777888]">Question {index + 1} of 3</span><div className="w-[160px]"><ProgressBar value={((index + 1) / 3) * 100} color="#7c5cff" /></div></div><h2 className="font-display text-[23px] font-semibold leading-tight tracking-[-0.05em] text-[#303142]">{questions[index]}</h2><div className="mt-6 space-y-2">{["GET", "POST", "PUT", "PATCH"].map((option) => <button key={option} onClick={() => setSelected(option)} className={cn("flex w-full items-center gap-3 rounded-[11px] border p-3 text-left text-[12px] font-semibold transition-colors", selected === option ? "border-[#b8acf0] bg-[#f3f0ff] text-[#644ed3]" : "border-[#ecebf0] text-[#666778] hover:bg-[#faf9fd]")}><span className={cn("flex h-6 w-6 items-center justify-center rounded-full border text-[10px]", selected === option ? "border-[#a899eb] bg-[#e8e3ff]" : "border-[#e5e4eb] text-[#a1a1ad]")}>{option.slice(0,1)}</span>{option}</button>)}</div><div className="mt-7 flex justify-between"><Button variant="secondary" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}><ChevronLeft size={14} /> Previous</Button>{index < 2 ? <Button onClick={() => { if (!selected) return toast.error("Choose an answer first"); setIndex(index + 1); setSelected(""); }}>Next <ChevronRight size={14} /></Button> : <Button onClick={() => { if (!selected) return toast.error("Choose an answer first"); setSubmitted(true); toast.success("Assessment submitted", { description: "Your score is 86%." }); }}>Submit assessment <Check size={14} /></Button>}</div>{submitted && <div className="mt-6 rounded-[12px] bg-[#eaf8ef] p-4 text-center"><div className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#4b9a6c]">Assessment complete</div><div className="mt-1 text-[26px] font-bold tracking-[-0.06em] text-[#287b50]">86%</div><Button size="sm" variant="secondary" className="mt-2" onClick={() => { setActive(null); setSubmitted(false); setIndex(0); setSelected(""); }}>Back to assessments</Button></div>}</div></>;
  return <><PageTitle eyebrow="Practice lab" title="Assess what you know" description="Short, focused assessments that reveal where to double down next." action={<Button onClick={() => toast.info("Assessment library updated", { description: "8 tracks available." })}><RefreshCw size={14} /> Refresh library</Button>} /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["DSA","12 questions","#ef9b62",Code2],["Python","15 questions","#4ea7a0",Code2],["AI / ML","18 questions","#7c5cff",Sparkles],["SQL","12 questions","#e0ad43",BarChart3],["JavaScript","15 questions","#e47c82",Code2],["System Design","10 questions","#6f8ddd",LayoutDashboard],["Web Development","16 questions","#8d78ce",HomeIcon],["Behavioral","10 questions","#4ea7a0",MessageCircle]].map(([name,count,color,Icon]) => <div key={name as string} className="rounded-[16px] border border-[#ecebf0] bg-white p-4 shadow-[0_5px_18px_rgba(35,35,58,0.035)]"><div className="flex items-start justify-between"><div className="flex h-9 w-9 items-center justify-center rounded-[10px]" style={{ color: color as string, backgroundColor: `${color}16` }}>{typeof Icon === "function" && <Icon size={16} />}</div><Badge tone="slate">18 min</Badge></div><div className="mt-5 text-[14px] font-bold text-[#494a5b]">{name as string}</div><div className="mt-1 text-[10px] text-[#999aa7]">{count as string} · Adaptive difficulty</div><Button size="sm" variant="soft" className="mt-4 w-full" onClick={() => { setActive(name as string); setIndex(0); setSelected(""); }}>Start assessment <ArrowRight size={12} /></Button></div>)}</div><div className="mt-5 rounded-[18px] border border-[#ecebf0] bg-white p-5 shadow-[0_5px_18px_rgba(35,35,58,0.035)]"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-[18px] font-semibold tracking-[-0.04em] text-[#292a3b]">Recent results</h2><p className="mt-1 text-[11px] text-[#999aa7]">Keep an eye on your weak topics.</p></div><Badge tone="green">Strong trend</Badge></div><div className="grid gap-3 md:grid-cols-3">{[["Python","86%","2 days ago","#4ea7a0"],["AI / ML","78%","Sep 15","#7c5cff"],["SQL","72%","Sep 08","#e0ad43"]].map(([name,score,date,color]) => <div key={name} className="flex items-center gap-3 rounded-[12px] bg-[#fafafd] p-3"><div className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold" style={{ color: color as string, backgroundColor: `${color}16` }}>{score}</div><div><div className="text-[11px] font-bold text-[#555667]">{name}</div><div className="mt-1 text-[10px] text-[#9d9daa]">{date}</div></div></div>)}</div></div></>;
}

function CareerAIPage() {
  const { profile } = useCareer();
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState([{ from: "ai", text: `Hi ${profile.name.split(" ")[0]} — I’m your career copilot. I know your ${profile.targetRole} target, current skills, resume, applications, and roadmap. What should we work on?` }, { from: "user", text: "What should I learn next?" }, { from: "ai", text: `Your highest-priority gap is ${profile.missingSkills[0] || "your next target skill"}. I’d learn embeddings, vector databases, retrieval, and context construction — then ship one small project. That single loop will improve both your match score and interview stories.` }]);
  if (!profile.resumeUpdatedAt) return <ResumeGate eyebrow="Career copilot" title="Give Career AI some context" description="Upload your resume first so the copilot can use your real experience, skills, projects, and target role." />;
  const send = () => {
    if (!input.trim()) return;
    const text = input.trim();
    const nextMessages = [...messages, { from: "user", text }];
    setTyping(true);
    setMessages(nextMessages);
    setInput("");
    void askGemini({ action: "chat", profile, message: text, history: nextMessages })
      .then((reply) => setMessages((current) => [...current, { from: "ai", text: reply }]))
      .catch((error) => {
        toast.error("Career AI is unavailable", { description: error instanceof Error ? error.message : "Try again in a moment." });
        setMessages((current) => [...current, { from: "ai", text: "I couldn’t reach Gemini right now. Please try again, or use the resume and job tools while the connection recovers." }]);
      })
      .finally(() => setTyping(false));
  };
  return <><PageTitle eyebrow="Career copilot" title="Ask better questions" description="A context-aware career assistant for your resume, skills, applications, and next move." action={<Button variant="secondary" onClick={() => { setMessages([{ from: "ai", text: "New conversation started. What would you like to figure out?" }]); toast.success("New conversation started"); }}><Plus size={14} /> New conversation</Button>} /><div className="grid gap-5 xl:grid-cols-[1fr_280px]"><div className="flex min-h-[590px] flex-col rounded-[18px] border border-[#ecebf0] bg-white shadow-[0_5px_18px_rgba(35,35,58,0.035)]"><div className="flex items-center gap-3 border-b border-[#f0eff3] p-4"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#171827] text-[#b7abff]"><Sparkles size={16} /></div><div><div className="text-[12px] font-bold text-[#414253]">CareerPilot AI</div><div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[#86a593]"><span className="h-1.5 w-1.5 rounded-full bg-[#70c497]" /> Gemini live · Context synced</div></div></div><div className="flex-1 space-y-5 overflow-auto p-5">{messages.map((message, i) => <div key={i} className={cn("flex gap-3", message.from === "user" && "justify-end")}><div className={cn("max-w-[78%] rounded-[14px] px-4 py-3 text-[12px] leading-5", message.from === "ai" ? "rounded-tl-[4px] bg-[#f5f2ff] text-[#5c5875]" : "rounded-tr-[4px] bg-[#171827] text-[#e9e8f2]")}>{message.text}</div></div>)}{typing && <div className="flex gap-3"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f0edff] text-[#735bdd]"><Sparkles size={13} /></div><div className="flex items-center gap-1 rounded-[14px] rounded-tl-[4px] bg-[#f5f2ff] px-4 py-3"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9784e8]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9784e8] [animation-delay:100ms]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9784e8] [animation-delay:200ms]" /></div></div>}</div><div className="border-t border-[#f0eff3] p-3"><div className="flex items-end gap-2 rounded-[12px] bg-[#f8f8fb] p-2"><textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Ask about your career…" rows={1} className="max-h-24 min-h-[34px] flex-1 resize-none bg-transparent px-2 py-2 text-[12px] outline-none placeholder:text-[#a6a7b2]" /><button onClick={send} className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#171827] text-white hover:bg-[#2c2d41]"><Send size={14} /></button></div><div className="mt-2 px-1 text-[9px] text-[#aaaab6]">Press Enter to send · CareerPilot AI uses your workspace context</div></div></div><div className="space-y-4"><div className="rounded-[18px] bg-[#171827] p-5 text-white"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a9a4c6]"><Zap size={12} /> Quick prompts</div><div className="mt-4 space-y-2">{["What should I learn next?","How can I improve my resume?","Which job should I apply to?","Practice a STAR answer"].map((prompt) => <button key={prompt} onClick={() => { setInput(prompt); }} className="flex w-full items-center justify-between rounded-[10px] bg-white/5 px-3 py-2.5 text-left text-[10px] font-semibold text-[#c4c2d3] hover:bg-white/10">{prompt}<ArrowRight size={12} className="text-[#8a86a3]" /></button>)}</div></div><div className="rounded-[18px] border border-[#ecebf0] bg-white p-4 shadow-[0_5px_18px_rgba(35,35,58,0.035)]"><div className="mb-3 text-[10px] font-bold uppercase tracking-[0.13em] text-[#aaaab5]">Context in use</div><div className="space-y-2">{[["Resume",`${profile.resumeScore} ATS score`],["Target role",profile.targetRole],["Skill gaps",`${profile.missingSkills.length} priorities`],["Applications","6 active"]].map(([label,value]) => <div key={label} className="flex items-center justify-between text-[10px]"><span className="text-[#999aa7]">{label}</span><span className="font-bold text-[#5b5c6d]">{value}</span></div>)}</div></div></div></div></>;
}

function AnalyticsPage() {
  const { profile } = useCareer();
  if (!profile.resumeUpdatedAt) return <ResumeGate eyebrow="Performance analytics" title="Your analytics will appear here" description="Upload your resume to start tracking personalized readiness, job matches, skill progress, and interview momentum." />;
  return <><PageTitle eyebrow="Performance analytics" title="See your momentum" description="A weekly view of the signals that make you more ready for the next opportunity." action={<Button variant="secondary" onClick={() => toast.success("Analytics exported") }><Download size={14} /> Export report</Button>} /><div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><StatCard label="Career readiness" value="78%" detail="+12 pts since July" icon={TrendingUp} color="#7c5cff" trend="12%" /><StatCard label="Avg. interview score" value="74" detail="Across 8 sessions" icon={Headphones} color="#ef9b62" trend="9%" /><StatCard label="Learning progress" value="68%" detail="4.2 hours this week" icon={BookOpen} color="#4ea7a0" /><StatCard label="Match quality" value="86%" detail="Top 10 job average" icon={Target} color="#e0ad43" /></div><div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]"><div className="rounded-[18px] border border-[#ecebf0] bg-white p-5 shadow-[0_5px_18px_rgba(35,35,58,0.035)]"><div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-[18px] font-semibold tracking-[-0.04em] text-[#292a3b]">Readiness over time</h2><p className="mt-1 text-[11px] text-[#999aa7]">Your combined score across the last 8 weeks.</p></div><Badge tone="green" dot>Trending up</Badge></div><div className="relative h-[220px] rounded-[12px] bg-[#fcfbff] p-4"><div className="absolute inset-x-4 top-8 border-t border-dashed border-[#ebe8f5]" /><div className="absolute inset-x-4 top-[76px] border-t border-dashed border-[#ebe8f5]" /><div className="absolute inset-x-4 top-[144px] border-t border-dashed border-[#ebe8f5]" /><div className="absolute bottom-7 left-4 right-4 flex items-end justify-between gap-2">{[42,46,48,55,57,65,71,78].map((v,i) => <div key={i} className="flex flex-1 flex-col items-center gap-2"><div className="relative flex h-[150px] w-full items-end justify-center"><div className={cn("w-[20px] rounded-t-[5px]", i === 7 ? "bg-[#7c5cff]" : "bg-[#dcd5ff]")} style={{ height: `${v * 1.6}px`, opacity: 0.55 + i * 0.06 }} /></div><span className="text-[9px] font-semibold text-[#a4a3b2]">W{i + 1}</span></div>)}</div><div className="absolute left-4 top-3 text-[9px] font-bold text-[#a8a6b5]">100</div><div className="absolute left-4 top-[73px] text-[9px] font-bold text-[#a8a6b5]">50</div><div className="absolute left-4 bottom-9 text-[9px] font-bold text-[#a8a6b5]">0</div></div></div><div className="rounded-[18px] border border-[#ecebf0] bg-white p-5 shadow-[0_5px_18px_rgba(35,35,58,0.035)]"><div className="mb-5"><h2 className="font-display text-[18px] font-semibold tracking-[-0.04em] text-[#292a3b]">Application funnel</h2><p className="mt-1 text-[11px] text-[#999aa7]">Where your opportunities stand.</p></div><div className="space-y-5">{[["Saved",24,"#c9c5dc"],["Applied",18,"#9d8eea"],["Screening",9,"#7c5cff"],["Interview",3,"#ef9b62"],["Offer",0,"#4ea7a0"]].map(([label,value,color]) => <div key={label}><div className="mb-1.5 flex justify-between text-[11px] font-bold"><span className="text-[#656677]">{label}</span><span className="text-[#353647]">{value}</span></div><ProgressBar value={Number(value) / 24 * 100} color={color as string} height="h-2" /></div>)}</div><div className="mt-7 rounded-[11px] bg-[#f6fbf8] p-3 text-[10px] leading-4 text-[#6a8b78]">Your screening-to-interview conversion is <span className="font-bold">33%</span>, above the benchmark for your target roles.</div></div></div><div className="mt-5 grid gap-5 lg:grid-cols-2"><div className="rounded-[18px] border border-[#ecebf0] bg-white p-5 shadow-[0_5px_18px_rgba(35,35,58,0.035)]"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-[18px] font-semibold tracking-[-0.04em] text-[#292a3b]">Skill progress</h2><p className="mt-1 text-[11px] text-[#999aa7]">Where your time is paying off.</p></div><button className="text-[11px] font-bold text-[#715be0]" onClick={() => toast.info("Skill details opened")}>Details <ArrowRight size={12} className="inline" /></button></div><div className="space-y-3">{[["Python",92,"#4ea7a0"],["Machine learning",78,"#7c5cff"],["System design",61,"#ef9b62"],["RAG",28,"#e0ad43"]].map(([name,value,color]) => <div key={name}><div className="mb-1.5 flex justify-between text-[11px] font-bold"><span className="text-[#656677]">{name}</span><span className="text-[#777888]">{value}%</span></div><ProgressBar value={value as number} color={color as string} /></div>)}</div></div><div className="rounded-[18px] border border-[#ecebf0] bg-white p-5 shadow-[0_5px_18px_rgba(35,35,58,0.035)]"><div className="mb-4"><h2 className="font-display text-[18px] font-semibold tracking-[-0.04em] text-[#292a3b]">Weekly activity</h2><p className="mt-1 text-[11px] text-[#999aa7]">A little consistency goes a long way.</p></div><div className="flex items-end justify-between gap-1">{[3,5,4,8,6,10,7,9,12,8,14,11].map((v,i) => <div key={i} className="flex flex-1 items-end justify-center"><div className={cn("w-full max-w-[18px] rounded-t-[4px]", i === 10 ? "bg-[#ef9b62]" : "bg-[#ded8ff]")} style={{ height: `${v * 9}px` }} /></div>)}</div><div className="mt-2 flex justify-between text-[9px] font-semibold text-[#a3a4b1]"><span>Aug 31</span><span>Sep 26</span></div></div></div></>;
}

function SettingsPage() {
  const { profile, updateProfile, resetProfile } = useCareer();
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState(profile.targetRole);
  const [locations, setLocations] = useState(profile.preferredLocations);
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState(true);
  useEffect(() => { setName(profile.name); setRole(profile.targetRole); setLocations(profile.preferredLocations); }, [profile.name, profile.targetRole, profile.preferredLocations]);
  const save = () => { updateProfile({ name: name.trim() || profile.name, targetRole: role, preferredLocations: locations }); setSaved(true); toast.success("Settings saved", { description: "Your updated profile is now used by Jobs and Interviews." }); setTimeout(() => setSaved(false), 1500); };
  return <><PageTitle eyebrow="Workspace settings" title="Make CareerPilot yours" description="Profile values extracted from your latest resume appear here and are used across every workspace section." action={<Button onClick={save}>{saved ? <><Check size={14} /> Saved</> : "Save changes"}</Button>} /><div className="mb-5 flex items-center gap-2 rounded-[12px] border border-[#e6f2eb] bg-[#f7fcf8] px-3.5 py-3 text-[11px] text-[#5d8b6e]"><CheckCircle2 size={14} className="shrink-0" /><span>Connected profile: <strong>{profile.name}</strong> · {profile.skills.length} skills · {profile.resumeFileName}</span></div><div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]"><div className="space-y-5"><div className="rounded-[18px] border border-[#ecebf0] bg-white p-5 shadow-[0_5px_18px_rgba(35,35,58,0.035)]"><div className="mb-4 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f6c1a4] text-[14px] font-bold text-[#6e4330]">{profile.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div><div><div className="text-[14px] font-bold text-[#3e3f50]">Profile</div><div className="mt-1 text-[10px] text-[#999aa7]">Synced from uploaded resume</div></div></div><label className="block text-[11px] font-bold text-[#606172]">Full name<input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 h-10 w-full rounded-[10px] border border-[#e5e4ed] px-3 text-[12px] outline-none focus:border-[#a096e6]" /></label><label className="mt-4 block text-[11px] font-bold text-[#606172]">Email<input value={profile.email} readOnly className="mt-2 h-10 w-full rounded-[10px] border border-[#e5e4ed] bg-[#fafafd] px-3 text-[12px] text-[#6f7080] outline-none" /></label><label className="mt-4 block text-[11px] font-bold text-[#606172]">Phone<input value={profile.phone} readOnly className="mt-2 h-10 w-full rounded-[10px] border border-[#e5e4ed] bg-[#fafafd] px-3 text-[12px] text-[#6f7080] outline-none" /></label></div><div className="rounded-[18px] border border-[#ecebf0] bg-white p-5 shadow-[0_5px_18px_rgba(35,35,58,0.035)]"><div className="mb-4 text-[14px] font-bold text-[#3e3f50]">Notifications</div>{[["Weekly progress digest","A short summary every Saturday",notifications,setNotifications],["New match alerts","Only roles above 85% fit",true,() => toast.success("Preference updated")],["Interview reminders","24 hours before scheduled practice",true,() => toast.success("Preference updated")]].map(([title,desc,value,toggle]) => <div key={title as string} className="flex items-center justify-between border-b border-[#f0eff3] py-3 last:border-0 last:pb-0"><div><div className="text-[11px] font-bold text-[#5a5b6c]">{title as string}</div><div className="mt-1 text-[10px] text-[#9c9da9]">{desc as string}</div></div><button onClick={() => (toggle as () => void)()} className={cn("relative h-5 w-9 rounded-full transition-colors", value ? "bg-[#7c5cff]" : "bg-[#d8d8df]")}><span className={cn("absolute top-1 h-3 w-3 rounded-full bg-white shadow-sm transition-transform", value ? "left-5" : "left-1")} /></button></div>)}</div></div><div className="space-y-5"><div className="rounded-[18px] border border-[#ecebf0] bg-white p-5 shadow-[0_5px_18px_rgba(35,35,58,0.035)]"><div className="mb-5"><div className="text-[14px] font-bold text-[#3e3f50]">Career target</div><div className="mt-1 text-[11px] text-[#999aa7]">Changing these values immediately affects match scoring and interview setup.</div></div><div className="grid gap-4 md:grid-cols-2"><label className="block text-[11px] font-bold text-[#606172]">Target role<select value={role} onChange={(e) => setRole(e.target.value)} className="mt-2 h-10 w-full rounded-[10px] border border-[#e5e4ed] bg-white px-3 text-[12px] font-semibold text-[#535465] outline-none"><option>AI Engineer</option><option>Machine Learning Engineer</option><option>Product Engineer</option></select></label><label className="block text-[11px] font-bold text-[#606172]">Experience level<select className="mt-2 h-10 w-full rounded-[10px] border border-[#e5e4ed] bg-white px-3 text-[12px] font-semibold text-[#535465] outline-none"><option>Early career · 2–4 years</option><option>Entry level</option><option>Mid level</option></select></label></div><label className="mt-4 block text-[11px] font-bold text-[#606172]">Preferred locations<input value={locations} onChange={(e) => setLocations(e.target.value)} className="mt-2 h-10 w-full rounded-[10px] border border-[#e5e4ed] px-3 text-[12px] outline-none focus:border-[#a096e6]" /></label></div><div className="rounded-[18px] border border-[#ecebf0] bg-white p-5 shadow-[0_5px_18px_rgba(35,35,58,0.035)]"><div className="mb-4 text-[14px] font-bold text-[#3e3f50]">Extracted resume details</div><div className="grid gap-3 md:grid-cols-2">{[["Education",profile.education.join(" · ")],["Experience",profile.experience.join(" · ")],["Projects",profile.projects.join(" · ")],["Certifications",profile.certifications.join(" · ") || "None detected"],["Links",profile.links.join(" · ") || "None detected"],["Missing skills",profile.missingSkills.join(" · ") || "None detected"]].map(([label,value]) => <div key={label} className="rounded-[11px] bg-[#fafafd] p-3"><div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#a5a5b2]">{label}</div><div className="mt-1 text-[11px] leading-4 text-[#676879]">{value}</div></div>)}</div></div><div className="flex items-start justify-between gap-3 rounded-[14px] border border-[#eeeaff] bg-[#fbfaff] p-4"><div className="flex items-start gap-3"><LockKeyhole size={15} className="mt-0.5 text-[#7962d8]" /><div><div className="text-[11px] font-bold text-[#5f51a7]">Single-user demo workspace</div><div className="mt-1 text-[10px] leading-4 text-[#9290a7]">Authentication is intentionally removed. Profile edits persist in this browser via local storage.</div></div></div><Button size="sm" variant="ghost" onClick={() => { resetProfile(); toast.success("Demo profile restored"); }}>Reset</Button></div></div></div></>;
}

export default function Home() {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const page = location === "/" ? "dashboard" : location.split("/")[1] || "dashboard";
  const navigate = (path: string) => { setLocation(path); window.scrollTo({ top: 0, behavior: "smooth" }); };
  useEffect(() => { const handle = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen(true); } if (event.key === "Escape") setCommandOpen(false); }; window.addEventListener("keydown", handle); return () => window.removeEventListener("keydown", handle); }, []);
  const content = location.startsWith("/interviews/room/") ? <InterviewRoom navigate={navigate} /> : location === "/interviews/new" ? <NewInterview navigate={navigate} /> : page === "dashboard" ? <Dashboard navigate={navigate} /> : page === "resume" ? <ResumePage /> : page === "jobs" ? <JobsPage /> : page === "skill-gaps" ? <SkillGapsPage /> : page === "applications" ? <ApplicationsPage /> : page === "interviews" ? <InterviewsPage navigate={navigate} /> : page === "assessments" ? <AssessmentsPage /> : page === "career-ai" ? <CareerAIPage /> : page === "analytics" ? <AnalyticsPage /> : page === "trending" ? <TrendsPage /> : page === "courses" ? <CoursesPage /> : page === "challenges" ? <ChallengesPage /> : page === "company-prep" ? <CompanyPrepPage /> : page === "agents" ? <AgentsPage /> : page === "settings" ? <SettingsPage /> : <Dashboard navigate={navigate} />;
  return <div className="min-h-screen bg-[#f8f8fb] text-[#292a3b]"><Sidebar path={location} navigate={navigate} open={mobileOpen} onClose={() => setMobileOpen(false)} /><div className="min-h-screen lg:pl-[246px]"><Topbar onMenu={() => setMobileOpen(true)} onCommand={() => setCommandOpen(true)} /><main className={cn("mx-auto max-w-[1400px] p-5 md:p-8", location.startsWith("/interviews/room/") && "max-w-none")}>{content}</main></div>{commandOpen && <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#171827]/25 p-4 pt-[14vh] backdrop-blur-sm" onClick={() => setCommandOpen(false)}><div className="w-full max-w-[540px] overflow-hidden rounded-[16px] border border-[#e7e5f0] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}><div className="flex items-center gap-3 border-b border-[#f0eff3] px-4 py-3"><Search size={16} className="text-[#9c9dab]" /><input autoFocus placeholder="Jump to a page or action…" className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#a7a8b3]" /></div><div className="p-2">{navItems.map(({ label, path: itemPath, icon: Icon }) => <button key={itemPath} onClick={() => { setCommandOpen(false); navigate(itemPath); }} className="flex w-full items-center gap-3 rounded-[9px] px-3 py-2.5 text-left text-[12px] font-semibold text-[#646576] hover:bg-[#f5f3fc] hover:text-[#5f4dcc]"><Icon size={15} />{label}<ArrowRight size={13} className="ml-auto text-[#b7b6c1]" /></button>)}</div><div className="border-t border-[#f0eff3] px-4 py-2 text-[9px] font-semibold text-[#aaaab5]">Esc to close · Demo workspace</div></div></div>}</div>;
}
