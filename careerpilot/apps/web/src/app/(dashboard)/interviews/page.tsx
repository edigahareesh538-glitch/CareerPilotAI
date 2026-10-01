"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Brain, Plus, Mic2, Play, Clock, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface InterviewSession {
  id: string;
  user_id: string;
  job_id: string | null;
  type: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  config: Record<string, any>;
  overall_score: number | null;
  created_at: string;
  job?: {
    id: string;
    title: string;
    company: string;
  };
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" | "info" }> = {
  scheduled: { label: "Scheduled", variant: "default" },
  in_progress: { label: "In Progress", variant: "info" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  failed: { label: "Failed", variant: "destructive" },
};

const typeLabels: Record<string, string> = {
  hr: "HR",
  technical: "Technical",
  behavioral: "Behavioral",
  resume_based: "Resume Based",
  job_specific: "Job Specific",
  coding: "Coding",
  mixed: "Mixed",
};

export default function InterviewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [selectedInterview, setSelectedInterview] = useState<InterviewSession | null>(null);
  const jobId = searchParams.get("jobId");

  const { data: interviews, isLoading } = useQuery({
    queryKey: ["interviews", page],
    queryFn: () => api.get<PaginatedResponse<InterviewSession>>(`/api/v1/interviews?page=${page}&page_size=20`),
  });

  const handleStartInterview = () => {
    router.push("/interviews/new" + (jobId ? `?jobId=${jobId}` : ""));
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interviews</h1>
          <p className="text-muted-foreground">Practice and review your AI-powered mock interviews</p>
        </div>
        <Button onClick={handleStartInterview}>
          <Plus className="mr-2 h-4 w-4" />
          New Interview
        </Button>
      </div>

      {jobId && (
        <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-amber-500" />
            <span>Ready to practice for a specific job? Start a tailored interview.</span>
          </div>
          <Button size="sm" onClick={handleStartInterview}>
            Start Job-Specific Interview
          </Button>
        </div>
      )}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <InterviewsList interviews={interviews?.items || []} isLoading={isLoading} onView={setSelectedInterview} />
        </TabsContent>
        <TabsContent value="upcoming">
          <InterviewsList
            interviews={interviews?.items.filter((i) => ["scheduled", "in_progress"].includes(i.status)) || []}
            isLoading={isLoading}
            onView={setSelectedInterview}
          />
        </TabsContent>
        <TabsContent value="completed">
          <InterviewsList
            interviews={interviews?.items.filter((i) => i.status === "completed") || []}
            isLoading={isLoading}
            onView={setSelectedInterview}
          />
        </TabsContent>
      </Tabs>

      {interviews && interviews.total > interviews.items.length && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="flex items-center px-4 text-sm">Page {page} of {Math.ceil(interviews.total / 20)}</span>
          <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(interviews.total / 20)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {selectedInterview && (
        <InterviewDetailModal interview={selectedInterview} onClose={() => setSelectedInterview(null)} />
      )}
    </div>
  );
}

function InterviewsList({ interviews, isLoading, onView }: {
  interviews: InterviewSession[];
  isLoading: boolean;
  onView: (interview: InterviewSession) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}><CardContent className="pt-6"><div className="animate-pulse space-y-3"><div className="h-4 bg-primary-foreground/10 rounded w-3/4" /><div className="h-3 bg-primary-foreground/10 rounded w-1/2" /></div></CardContent></Card>
        ))}
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Mic2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No interviews yet</h3>
          <p className="mt-2 text-muted-foreground">Start a new mock interview to practice your skills</p>
          <Button className="mt-4" onClick={() => window.location.href = "/interviews/new"}>
            <Plus className="mr-2 h-4 w-4" />
            Start Interview
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {interviews.map((interview) => (
        <Card key={interview.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold capitalize">{typeLabels[interview.type] || interview.type} Interview</h3>
                  <Badge variant={statusConfig[interview.status]?.variant || "default"}>
                    {statusConfig[interview.status]?.label || interview.status}
                  </Badge>
                </div>
                {interview.job && (
                  <p className="text-accent text-sm font-medium">{interview.job.title} at {interview.job.company}</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Created {formatDate(interview.created_at)}</span>
              {interview.duration_seconds && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(interview.duration_seconds)}
                </span>
              )}
            </div>

            {interview.overall_score !== null && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Overall Score</span>
                  <span className="font-semibold">{interview.overall_score}%</span>
                </div>
                <div className="h-2 bg-primary-foreground/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500 transition-all duration-500"
                    style={{ width: `${interview.overall_score}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-primary-foreground/10">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => onView(interview)}>
                View Details
              </Button>
              {interview.status === "in_progress" && (
                <Button variant="default" size="sm" className="flex-1" onClick={() => window.location.href = `/interviews/room/${interview.id}`}>
                  <Play className="mr-2 h-4 w-4" />
                  Continue
                </Button>
              )}
              {interview.status === "scheduled" && (
                <Button variant="default" size="sm" className="flex-1" onClick={() => window.location.href = `/interviews/room/${interview.id}`}>
                  <Play className="mr-2 h-4 w-4" />
                  Start
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function InterviewDetailModal({ interview, onClose }: {
  interview: InterviewSession;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-primary-foreground/10 bg-primary p-6 shadow-lg">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold capitalize">{typeLabels[interview.type] || interview.type} Interview</h2>
            {interview.job && <p className="text-accent">{interview.job.title} at {interview.job.company}</p>}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-primary-foreground">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant={statusConfig[interview.status]?.variant || "default"} className="text-lg px-3 py-1">
              {statusConfig[interview.status]?.label || interview.status}
            </Badge>
            {interview.overall_score !== null && (
              <Badge variant={interview.overall_score >= 80 ? "success" : interview.overall_score >= 60 ? "warning" : "default"} className="text-lg px-3 py-1">
                Score: {interview.overall_score}%
              </Badge>
            )}
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p>{formatDate(interview.created_at)}</p>
            </div>
            {interview.started_at && (
              <div>
                <p className="text-sm text-muted-foreground">Started</p>
                <p>{formatDate(interview.started_at)}</p>
              </div>
            )}
            {interview.ended_at && (
              <div>
                <p className="text-sm text-muted-foreground">Ended</p>
                <p>{formatDate(interview.ended_at)}</p>
              </div>
            )}
            {interview.duration_seconds && (
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p>{formatDuration(interview.duration_seconds)}</p>
              </div>
            )}
          </div>

          {interview.config && Object.keys(interview.config).length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Configuration</h4>
              <pre className="text-xs text-muted-foreground p-3 rounded-lg bg-primary-foreground/5 overflow-auto max-h-40">
                {JSON.stringify(interview.config, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-primary-foreground/10">
            <Button variant="outline" onClick={onClose}>Close</Button>
            {(interview.status === "scheduled" || interview.status === "in_progress") && (
              <Button variant="default" onClick={() => { onClose(); window.location.href = `/interviews/room/${interview.id}`; }}>
                <Play className="mr-2 h-4 w-4" />
                {interview.status === "in_progress" ? "Continue" : "Start"} Interview
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}