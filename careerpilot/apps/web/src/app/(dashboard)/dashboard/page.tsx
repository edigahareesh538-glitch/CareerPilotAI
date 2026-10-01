"use client";

import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Link } from "next/link";
import {
  Brain,
  Briefcase,
  FileText,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Mic2,
} from "lucide-react";

interface DashboardStats {
  career_readiness: number;
  resume_score: number;
  skills_score: number;
  projects_score: number;
  interview_score: number;
  communication_score: number;
  job_match_score: number;
}

interface JobMatch {
  id: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string | null;
    is_remote: boolean;
    match_score: number;
  };
}

interface Application {
  id: string;
  status: string;
  job: { title: string; company: string };
  created_at: string;
}

interface InterviewSession {
  id: string;
  type: string;
  status: string;
  overall_score: number | null;
  created_at: string;
}

function StatCard({ title, value, icon: Icon, description, trend }: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
  trend?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && <p className="text-xs text-green-500">{trend}</p>}
      </CardContent>
    </Card>
  );
}

function ScoreCard({ label, score, icon: Icon, color = "accent" }: {
  label: string;
  score: number;
  icon: React.ElementType;
  color?: "accent" | "green" | "amber" | "red";
}) {
  const colorClasses = {
    accent: "bg-accent",
    green: "bg-green-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium">
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </span>
        <span className="font-semibold">{score}/100</span>
      </div>
      <Progress value={score} className={colorClasses[color]} />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get<DashboardStats>("/api/v1/dashboard/stats"),
  });

  const { data: matches } = useQuery({
    queryKey: ["job-matches", "top5"],
    queryFn: () => api.get<JobMatch[]>("/api/v1/jobs/matches?limit=5&min_score=50"),
  });

  const { data: applications } = useQuery({
    queryKey: ["recent-applications"],
    queryFn: () => api.get<Application[]>("/api/v1/applications?limit=5"),
  });

  const { data: interviews } = useQuery({
    queryKey: ["recent-interviews"],
    queryFn: () => api.get<InterviewSession[]>("/api/v1/interviews?limit=5"),
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.full_name || "there"}! Here's your career overview.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Career Readiness" value={`${stats?.career_readiness || 0}%`} icon={Brain} description="Overall career health" />
          <StatCard title="Active Applications" value={applications?.length || 0} icon={Briefcase} description="Currently tracking" />
          <StatCard title="Job Matches" value={matches?.length || 0} icon={Target} description="Above 50% match" />
          <StatCard title="Learning Progress" value={`${stats?.skills_score || 0}%`} icon={GraduationCap} description="Skill completion" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Career Readiness Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats && (
                <>
                  <ScoreCard label="Resume Quality" score={stats.resume_score} icon={FileText} />
                  <ScoreCard label="Technical Skills" score={stats.skills_score} icon={Brain} color="green" />
                  <ScoreCard label="Project Portfolio" score={stats.projects_score} icon={Briefcase} color="amber" />
                  <ScoreCard label="Interview Skills" score={stats.interview_score} icon={Mic2} color="red" />
                  <ScoreCard label="Communication" score={stats.communication_score} icon={TrendingUp} />
                  <ScoreCard label="Job Market Match" score={stats.job_match_score} icon={Target} color="green" />
                </>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Top Job Matches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {matches?.length ? (
                matches.map((match) => (
                  <Link key={match.id} href={`/jobs/${match.job.id}`} className="flex items-center justify-between p-3 rounded-lg border border-primary-foreground/10 hover:bg-primary/10 transition-colors">
                    <div>
                      <p className="font-medium">{match.job.title}</p>
                      <p className="text-sm text-muted-foreground">{match.job.company} • {match.job.is_remote ? "Remote" : match.job.location}</p>
                    </div>
                    <Badge variant={match.job.match_score >= 80 ? "success" : match.job.match_score >= 60 ? "warning" : "default"}>
                      {match.job.match_score}%
                    </Badge>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No matches yet. Upload your resume to get started.</p>
              )}
              <Button variant="outline" asChild className="w-full mt-2">
                <Link href="/jobs">View All Matches</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Applications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {applications?.length ? (
                applications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 rounded-lg border border-primary-foreground/10">
                    <div>
                      <p className="font-medium">{app.job.title}</p>
                      <p className="text-sm text-muted-foreground">{app.job.company}</p>
                    </div>
                    <Badge variant={
                      app.status === "applied" ? "default" :
                      app.status === "interview" ? "success" :
                      app.status === "offer" ? "success" :
                      app.status === "rejected" ? "destructive" :
                      "secondary"
                    }>
                      {app.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No applications yet</p>
              )}
              <Button variant="outline" asChild className="w-full mt-2">
                <Link href="/applications">View All Applications</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic2 className="h-4 w-4" />
                Recent Interviews
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {interviews?.length ? (
                interviews.map((interview) => (
                  <div key={interview.id} className="flex items-center justify-between p-3 rounded-lg border border-primary-foreground/10">
                    <div>
                      <p className="font-medium capitalize">{interview.type.replace("_", " ")} Interview</p>
                      <p className="text-sm text-muted-foreground">Created {new Date(interview.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {interview.overall_score !== null && (
                        <Badge variant={interview.overall_score >= 80 ? "success" : interview.overall_score >= 60 ? "warning" : "default"}>
                          {interview.overall_score}%
                        </Badge>
                      )}
                      <Badge variant={interview.status === "completed" ? "success" : interview.status === "in_progress" ? "default" : "secondary"}>
                        {interview.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No interviews scheduled</p>
              )}
              <Button variant="outline" asChild className="w-full mt-2">
                <Link href="/interviews">View All Interviews</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Button variant="outline" asChild className="h-24 flex flex-col items-center justify-center gap-2">
                <Link href="/resume/upload">
                  <FileText className="h-8 w-8" />
                  Upload Resume
                </Link>
              </Button>
              <Button variant="outline" asChild className="h-24 flex flex-col items-center justify-center gap-2">
                <Link href="/jobs/discover">
                  <Briefcase className="h-8 w-8" />
                  Discover Jobs
                </Link>
              </Button>
              <Button variant="outline" asChild className="h-24 flex flex-col items-center justify-center gap-2">
                <Link href="/interviews/new">
                  <Mic2 className="h-8 w-8" />
                  Practice Interview
                </Link>
              </Button>
              <Button variant="outline" asChild className="h-24 flex flex-col items-center justify-center gap-2">
                <Link href="/coach">
                  <Brain className="h-8 w-8" />
                  Ask Career Coach
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}