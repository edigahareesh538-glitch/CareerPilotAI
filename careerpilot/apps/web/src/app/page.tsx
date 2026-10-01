import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
        CareerPilot AI
      </h1>
      <p className="mb-10 max-w-2xl text-lg text-muted-foreground">
        Your AI Career Copilot — upload a resume, get matched, close skill gaps,
        prep applications, and ace interviews with a realistic AI interviewer.
      </p>
      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90"
        >
          Enter Dashboard
        </Link>
        <Link
          href="/auth/register"
          className="rounded-md border border-primary-foreground/20 px-6 py-3 text-sm font-semibold hover:bg-primary/50"
        >
          Create an Account
        </Link>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        No sign-in required — jump straight into the dashboard, or create an account to save your own data.
      </p>
    </main>
  );
}