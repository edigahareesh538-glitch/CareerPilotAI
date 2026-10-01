# CareerPilot AI

Run: `pnpm install && pnpm dev` -> http://localhost:3000 (no login). Copy `.env.example` to `.env` and set `GEMINI_API_KEY` (AI features) and `YOUTUBE_API_KEY` (course videos).

## New in this update
- `server/agents.ts`: LLM provider abstraction, 14 agents with permissions/timeouts/retries/rate limits, orchestrator, activity log, `/api/agents*`, `/api/trends/jobs` (live Remotive data), `/api/learning/resources` (YouTube Data API).
- Pages: Trending, Courses (embedded YouTube player), Challenges + local leaderboard, Company prep, Agents.
- Unavailable services show an explicit error; nothing is fabricated. Leaderboard is local-only.
- Tests: `pnpm vitest run`. Not yet built: Supabase/FastAPI/pgvector/Redis/workers, 3D avatar, voice WebSocket, expanded interview and coding practice.
