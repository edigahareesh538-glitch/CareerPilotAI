// Vite emits this worker beside the application bundle, avoiding PDF.js's
// default relative path (which points at the current route and often 404s).
// @ts-ignore -- Vite provides the ?url module at build time.
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";

export type CareerProfile = {
  name: string;
  email: string;
  phone: string;
  targetRole: string;
  preferredLocations: string;
  skills: string[];
  missingSkills: string[];
  education: string[];
  experience: string[];
  projects: string[];
  certifications: string[];
  links: string[];
  resumeFileName: string;
  resumeText: string;
  resumeUpdatedAt: number;
  resumeScore: number;
  atsScore: number;
  skillsScore: number;
  experienceScore: number;
  projectsScore: number;
  keywordScore: number;
  readiness: number;
};

export const demoProfile: CareerProfile = {
  name: "Hareesh S.",
  email: "hareesh@careerpilot.dev",
  phone: "+91 98765 43210",
  targetRole: "AI Engineer",
  preferredLocations: "Remote, Hyderabad, Bengaluru",
  skills: ["Python", "Machine Learning", "LLM APIs", "React", "SQL", "Git", "JavaScript"],
  missingSkills: ["RAG", "FastAPI", "Docker", "PostgreSQL", "Vector Databases"],
  education: ["B.Tech in Computer Science · 2021–2025"],
  experience: ["Software Engineer Intern · Built applied AI workflows", "Freelance AI Developer · Shipped 3 client projects"],
  projects: ["RAG knowledge assistant", "Resume intelligence platform", "Customer support classifier"],
  certifications: ["Google Cloud Digital Leader"],
  links: ["github.com/hareeshs", "linkedin.com/in/hareeshs"],
  resumeFileName: "Hareesh_S_Resume.pdf",
  resumeText: "",
  resumeUpdatedAt: 0,
  resumeScore: 82,
  atsScore: 82,
  skillsScore: 76,
  experienceScore: 88,
  projectsScore: 85,
  keywordScore: 79,
  readiness: 78,
};

export const emptyProfile: CareerProfile = {
  name: "",
  email: "",
  phone: "",
  targetRole: "",
  preferredLocations: "",
  skills: [],
  missingSkills: [],
  education: [],
  experience: [],
  projects: [],
  certifications: [],
  links: [],
  resumeFileName: "No resume uploaded",
  resumeText: "",
  resumeUpdatedAt: 0,
  resumeScore: 0,
  atsScore: 0,
  skillsScore: 0,
  experienceScore: 0,
  projectsScore: 0,
  keywordScore: 0,
  readiness: 0,
};

const knownSkills = [
  "Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Java", "SQL", "PostgreSQL", "MongoDB", "Git", "Docker", "Kubernetes", "AWS", "Azure", "FastAPI", "Django", "Machine Learning", "Deep Learning", "PyTorch", "TensorFlow", "LLM APIs", "RAG", "Vector Databases", "MLOps", "System Design", "HTML", "CSS", "Tailwind CSS", "REST APIs", "OpenAI", "LangChain",
];

const targetSkills: Record<string, string[]> = {
  "AI Engineer": ["Python", "Machine Learning", "LLM APIs", "RAG", "FastAPI", "Docker", "Vector Databases"],
  "Machine Learning Engineer": ["Python", "Machine Learning", "PyTorch", "MLOps", "Docker", "SQL", "System Design"],
  "Product Engineer": ["TypeScript", "React", "Next.js", "Node.js", "SQL", "System Design", "REST APIs"],
};

const sectionNames = ["education", "experience", "work experience", "projects", "certifications", "skills", "achievements", "links"];

function linesBetween(text: string, section: string): string[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const start = lines.findIndex((line) => line.toLowerCase().replace(/[:#]/g, "").trim() === section);
  if (start < 0) return [];
  const result: string[] = [];
  for (let i = start + 1; i < lines.length && result.length < 6; i += 1) {
    const current = lines[i].toLowerCase().replace(/[:#]/g, "").trim();
    if (sectionNames.includes(current)) break;
    if (lines[i].length > 2) result.push(lines[i]);
  }
  return result;
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function analyzeResumeText(text: string, fileName: string): CareerProfile {
  const normalized = text.replace(/\u0000/g, " ").replace(/\t/g, " ").replace(/[ ]{2,}/g, " ").trim();
  const lower = normalized.toLowerCase();
  const lines = normalized.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const email = normalized.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || demoProfile.email;
  const phone = normalized.match(/(?:\+?\d[\d ()-]{8,}\d)/)?.[0]?.trim() || demoProfile.phone;
  const name = lines.find((line) => line.length > 2 && line.length < 48 && !line.includes("@") && !/resume|curriculum vitae|profile|phone|mobile/i.test(line) && !/\d{4}/.test(line)) || demoProfile.name;
  const matchedSkills = knownSkills.filter((skill) => lower.includes(skill.toLowerCase()));
  const role = lower.includes("machine learning") || lower.includes("ml engineer") ? "Machine Learning Engineer" : lower.includes("product engineer") ? "Product Engineer" : "AI Engineer";
  const desiredSkills = targetSkills[role] || targetSkills["AI Engineer"];
  const education = linesBetween(normalized, "education");
  const experience = linesBetween(normalized, "experience").concat(linesBetween(normalized, "work experience"));
  const projects = linesBetween(normalized, "projects");
  const certifications = linesBetween(normalized, "certifications");
  const links = unique((normalized.match(/(?:https?:\/\/)?(?:www\.)?(?:github\.com|linkedin\.com|behance\.net|portfolio\.[^\s/]+)[^\s]*/gi) || []).map((value) => value.replace(/[),.;]+$/, "")));
  const sectionCount = ["education", "experience", "projects", "skills", "certifications"].filter((section) => lower.includes(section)).length;
  const skillsScore = Math.min(96, 48 + matchedSkills.length * 5);
  const experienceScore = Math.min(96, 54 + Math.min(experience.length, 5) * 8 + (lower.includes("impact") || lower.includes("reduced") || lower.includes("increased") ? 8 : 0));
  const projectsScore = Math.min(96, 52 + Math.min(projects.length, 4) * 9 + (lower.includes("github") ? 7 : 0));
  const atsScore = Math.min(96, 54 + sectionCount * 7 + (email !== demoProfile.email ? 4 : 0));
  const keywordScore = Math.min(96, 50 + matchedSkills.length * 4);
  const resumeScore = Math.round((atsScore + skillsScore + experienceScore + projectsScore + keywordScore) / 5);
  const missingSkills = desiredSkills.filter((skill) => !matchedSkills.some((found) => found.toLowerCase() === skill.toLowerCase()));
  const readiness = Math.round((resumeScore * 0.35) + (skillsScore * 0.2) + (projectsScore * 0.18) + 12 + Math.min(matchedSkills.length, 10));

  return {
    name,
    email,
    phone,
    targetRole: role,
    preferredLocations: demoProfile.preferredLocations,
    skills: matchedSkills.length ? matchedSkills : demoProfile.skills,
    missingSkills: missingSkills.length ? missingSkills : demoProfile.missingSkills,
    education: education.length ? education : ["Education details detected in uploaded resume"],
    experience: experience.length ? experience : ["Experience details detected in uploaded resume"],
    projects: projects.length ? projects : ["Projects section detected in uploaded resume"],
    certifications: certifications.length ? certifications : [],
    links: links.length ? links : [],
    resumeFileName: fileName,
    resumeText: normalized,
    resumeUpdatedAt: Date.now(),
    resumeScore,
    atsScore,
    skillsScore,
    experienceScore,
    projectsScore,
    keywordScore,
    readiness: Math.min(99, readiness),
  };
}

export async function extractResumeText(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !["pdf", "docx", "txt"].includes(extension)) throw new Error("Please upload a PDF, DOCX, or TXT resume.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Resume files must be smaller than 10 MB.");
  if (extension === "txt") {
    const text = await file.text();
    if (!text.trim()) throw new Error("This text file is empty.");
    return text;
  }
  if (extension === "docx") {
    // Use the browser bundle explicitly; the Node entry expects a Buffer/path
    // and can report “Could not find file in options” in Vite builds.
    // @ts-ignore -- Mammoth exposes this browser entry without a TS declaration.
    const mammoth = await import("mammoth/mammoth.browser.js");
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    if (!result.value.trim()) throw new Error("This DOCX does not contain readable text.");
    return result.value;
  }
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    useWorkerFetch: false,
  }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => {
      const value = "str" in item ? item.str : "";
      return `${value}${"hasEOL" in item && item.hasEOL ? "\n" : " "}`;
    }).join("").trim());
  }
  const text = pages.join("\n").trim();
  if (!text) throw new Error("This PDF has no selectable text. Export it again as a text-based PDF or upload the DOCX version.");
  return text;
}

export function scoreJob(job: { tags: string[]; role: string; location: string; match: number }, profile: CareerProfile): number {
  const skillHits = job.tags.filter((tag) => profile.skills.some((skill) => skill.toLowerCase() === tag.toLowerCase())).length;
  const skillScore = Math.round((skillHits / Math.max(job.tags.length, 1)) * 16);
  const roleBoost = profile.targetRole.toLowerCase().includes("product") && job.role.toLowerCase().includes("product") ? 4 : profile.targetRole.toLowerCase().includes("machine") && job.role.toLowerCase().includes("machine") ? 4 : job.role.toLowerCase().includes("ai") ? 3 : 0;
  return Math.min(99, Math.max(58, job.match - 8 + skillScore + roleBoost));
}

export function profileStorageKey() {
  return "careerpilot.profile.v2";
}
