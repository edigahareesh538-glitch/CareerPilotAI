import "dotenv/config";

type CareerProfile = {
  name?: string;
  email?: string;
  targetRole?: string;
  skills?: string[];
  missingSkills?: string[];
  experience?: string[];
  projects?: string[];
  education?: string[];
  preferredLocations?: string;
  resumeScore?: number;
};

type RequestLike = {
  body?: unknown;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => void;
};

const MAX_PROFILE_TEXT = 6_000;
const MAX_MESSAGE_TEXT = 2_000;

function configuredKey() {
  return process.env.GEMINI_API_KEY?.trim();
}

function modelName() {
  // Direct primary fallback set to gemini-3.8-flash
  return process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
}

function profileContext(profile: CareerProfile) {
  return JSON.stringify({
    name: profile.name,
    targetRole: profile.targetRole,
    skills: profile.skills?.slice(0, 30),
    missingSkills: profile.missingSkills?.slice(0, 12),
    experience: profile.experience?.slice(0, 6),
    projects: profile.projects?.slice(0, 6),
    education: profile.education?.slice(0, 4),
    preferredLocations: profile.preferredLocations,
    resumeScore: profile.resumeScore,
  }).slice(0, MAX_PROFILE_TEXT);
}

export async function generate(prompt: string, systemInstruction: string) {
  const apiKey = configuredKey();
  if (!apiKey) throw new Error("Gemini is not configured on the server.");

  // Secondary fallback models sequence: gemini-3.8-flash -> gemini-3.5-flash-lite -> gemini-2.5-flash
  const models = Array.from(
    new Set([modelName(), "gemini-3.5-flash-lite", "gemini-2.5-flash"])
  );

  let lastError = "Gemini request failed.";
  for (const model of models) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [
            { role: "user", parts: [{ text: prompt.slice(0, 12_000) }] },
          ],
          generationConfig: { temperature: 0.7, maxOutputTokens: 900 },
        }),
      }
    );

    const payload = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
      error?: { message?: string };
    };

    if (response.ok) {
      const text = payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("\n")
        .trim();
      if (text) return text;
      lastError = "Gemini returned an empty response.";
    } else {
      lastError =
        payload.error?.message ||
        `Gemini request failed with ${response.status}.`;
      const retryable =
        response.status === 429 ||
        response.status >= 500 ||
        /high demand|temporarily|unavailable|deprecated|not found/i.test(
          lastError
        );
      if (!retryable) break;
    }
  }
  throw new Error(lastError);
}

export async function handleGeminiRequest(req: RequestLike, res: ResponseLike) {
  try {
    const body = (req.body || {}) as {
      action?: string;
      profile?: CareerProfile;
      message?: string;
      history?: Array<{ from?: string; text?: string }>;
      interviewType?: string;
      difficulty?: string;
    };
    const profile = body.profile || {};
    const context = profileContext(profile);

    if (body.action === "interview") {
      const interviewType = body.interviewType || "Technical";
      const difficulty = body.difficulty || "Medium";
      const text = await generate(
        `Create one ${difficulty} ${interviewType} interview question for this candidate. Return only the question, with no numbering or preamble. Candidate profile JSON: ${context}`,
        "You are Ari, a professional AI interviewer. Ask fair, specific, role-relevant questions grounded in the candidate profile. Do not invent experience that is not present."
      );
      return res.json({ ok: true, text });
    }

    const message = String(body.message || "")
      .trim()
      .slice(0, MAX_MESSAGE_TEXT);
    if (!message)
      return res
        .status(400)
        .json({ ok: false, error: "Message is required." });

    const history = (body.history || [])
      .slice(-8)
      .map(
        (item) =>
          `${item.from === "user" ? "Candidate" : "Ari"}: ${String(
            item.text || ""
          ).slice(0, MAX_MESSAGE_TEXT)}`
      )
      .join("\n");

    const text = await generate(
      `Candidate profile JSON: ${context}\nRecent conversation:\n${history}\nCandidate asks: ${message}\nGive a practical answer with clear next actions.`,
      "You are CareerPilot AI, a concise and supportive career coach. Use only the candidate context provided. Explain reasoning, be honest about uncertainty, and prefer actionable advice over generic motivation."
    );
    return res.json({ ok: true, text });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gemini request failed.";
    return res.status(502).json({ ok: false, error: message });
  }
}

export function isGeminiConfigured() {
  return Boolean(configuredKey());
}