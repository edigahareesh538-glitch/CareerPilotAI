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

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

const MAX_PROFILE_TEXT = 6_000;
const MAX_MESSAGE_TEXT = 2_000;
const MAX_PROMPT_TEXT = 12_000;
const MAX_HISTORY_ITEMS = 8;

function configuredKey(): string | undefined {
  const key = process.env.GEMINI_API_KEY?.trim();
  return key || undefined;
}

function modelName(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
}

function profileContext(profile: CareerProfile): string {
  const context = {
    name: profile.name,
    targetRole: profile.targetRole,
    skills: profile.skills?.slice(0, 30),
    missingSkills: profile.missingSkills?.slice(0, 12),
    experience: profile.experience?.slice(0, 6),
    projects: profile.projects?.slice(0, 6),
    education: profile.education?.slice(0, 4),
    preferredLocations: profile.preferredLocations,
    resumeScore: profile.resumeScore,
  };

  return JSON.stringify(context).slice(0, MAX_PROFILE_TEXT);
}

/**
 * Generate a response using Google Gemini.
 */
export async function generate(
  prompt: string,
  systemInstruction: string
): Promise<string> {
  const apiKey = configuredKey();

  if (!apiKey) {
    throw new Error(
      "Gemini API key is not configured on the backend. Set GEMINI_API_KEY."
    );
  }

  // Ordered fallback sequence across valid Gemini models
  const models = Array.from(
    new Set([
      modelName(),
      "gemini-3.8-flash",
      "gemini-2.5-flash",
      "gemini-1.5-flash",
    ])
  );

  let lastError = "Gemini request failed.";

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey, // Sends AQ... keys correctly in request header
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: systemInstruction.slice(0, MAX_MESSAGE_TEXT),
              },
            ],
          },

          contents: [
            {
              role: "user",
              parts: [
                {
                  text: prompt.slice(0, MAX_PROMPT_TEXT),
                },
              ],
            },
          ],

          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 900,
          },
        }),
      });

      const payload = (await response.json()) as GeminiResponse;

      if (response.ok) {
        const text = payload.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? "")
          .join("\n")
          .trim();

        if (text) {
          return text;
        }

        lastError = "Gemini returned an empty response.";
        continue;
      }

      lastError =
        payload.error?.message ||
        `Gemini request failed with HTTP ${response.status}.`;

      const retryable =
        response.status === 429 ||
        response.status >= 500 ||
        response.status === 404 ||
        /high demand|temporarily|unavailable|not found|deprecated/i.test(
          lastError
        );

      if (!retryable) {
        break;
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        lastError = error.message;
      } else {
        lastError = "Network error while connecting to Gemini API.";
      }
    }
  }

  throw new Error(lastError);
}

/**
 * Handles CareerPilot Gemini requests.
 */
export async function handleGeminiRequest(
  req: RequestLike,
  res: ResponseLike
): Promise<void> {
  try {
    const body = (req.body ?? {}) as {
      action?: string;
      profile?: CareerProfile;
      message?: string;
      history?: Array<{
        from?: string;
        text?: string;
      }>;
      interviewType?: string;
      difficulty?: string;
    };

    const profile: CareerProfile = body.profile ?? {};
    const context = profileContext(profile);

    /*
     * ---------------------------------------------------------
     * INTERVIEW QUESTION
     * ---------------------------------------------------------
     */
    if (body.action === "interview") {
      const interviewType = String(body.interviewType || "Technical")
        .trim()
        .slice(0, 100);

      const difficulty = String(body.difficulty || "Medium")
        .trim()
        .slice(0, 50);

      const prompt = `
Create ONE ${difficulty} ${interviewType} interview question
for the candidate described below.

Candidate profile:
${context}

Requirements:
- Return only the interview question.
- Do not number the question.
- Do not add a preamble.
- Keep it relevant to the candidate's profile.
- Do not invent experience or skills.
`.trim();

      const text = await generate(
        prompt,
        `
You are Ari, a professional AI interviewer.

Ask fair, specific and role-relevant interview questions.

Use only the candidate information provided.
Never invent experience, projects, skills, companies or qualifications.

Keep questions realistic and useful for interview preparation.
`.trim()
      );

      res.json({
        ok: true,
        text,
      });

      return;
    }

    /*
     * ---------------------------------------------------------
     * NORMAL CAREER CHAT
     * ---------------------------------------------------------
     */
    const message = String(body.message ?? "")
      .trim()
      .slice(0, MAX_MESSAGE_TEXT);

    if (!message) {
      res.status(400).json({
        ok: false,
        error: "Message is required.",
      });

      return;
    }

    /*
     * ---------------------------------------------------------
     * CONVERSATION HISTORY
     * ---------------------------------------------------------
     */
    const history = (Array.isArray(body.history) ? body.history : [])
      .slice(-MAX_HISTORY_ITEMS)
      .map((item) => {
        const role = item.from === "user" ? "Candidate" : "Ari";

        const text = String(item.text ?? "")
          .trim()
          .slice(0, MAX_MESSAGE_TEXT);

        return `${role}: ${text}`;
      })
      .join("\n");

    /*
     * ---------------------------------------------------------
     * CAREER COACH PROMPT
     * ---------------------------------------------------------
     */
    const prompt = `
Candidate profile:
${context}

Recent conversation:
${history || "No previous conversation."}

Candidate's current question:
${message}

Provide a practical and personalized answer.

Requirements:
- Use the candidate profile when relevant.
- Do not invent candidate information.
- Explain important reasoning briefly.
- Be honest when information is unavailable.
- Prefer concrete next actions over generic motivation.
- Keep the response concise and useful.
`.trim();

    const text = await generate(
      prompt,
      `
You are CareerPilot AI, an AI career coach.

Your job is to help students and job seekers with:
- Career planning
- Resume improvement
- Job preparation
- Skill development
- Learning roadmaps
- DSA and coding preparation
- SQL preparation
- Interview preparation
- Company preparation

Use only the candidate context provided.

Never fabricate:
- Experience
- Skills
- Projects
- Education
- Companies
- Achievements
- Job history

If something is unknown, clearly say so.

Give practical, actionable and personalized guidance.
`.trim()
    );

    res.json({
      ok: true,
      text,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Gemini request failed.";

    console.error("CareerPilot Gemini error:", error);

    res.status(502).json({
      ok: false,
      error: message,
    });
  }
}

/**
 * Check whether Gemini is configured.
 */
export function isGeminiConfigured(): boolean {
  return Boolean(configuredKey());
}