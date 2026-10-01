"use client";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Brain, Building2, MapPin, Briefcase, DollarSign, Calendar, ExternalLink, CheckCircle, AlertCircle, Target, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Job {
  id: string;
  provider: string;
  external_id: string;
  company: string;
  title: string;
  description: string;
  location: string | null;
  is_remote: boolean;
  employment_type: string | null;
  experience_level: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  url: string;
  posted_at: string | null;
  skills: Array<{ id: string; name: string; category: string; weight: number }>;
}

interface JobMatch {
  id: string;
  job: Job;
  score: number;
  explanation: {
    skill_match: { score: number; matched: string[]; missing: string[] };
    experience_match: { score: number; user_years: number; required_level: string };
    embedding_match: { score: number };
    weights: { skill: number; experience: number; embedding: number };
  };
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const jobId = params.id as string;

  const { data: match } = useQuery({
    queryKey: ["job-match", jobId],
    queryFn: () => api.get<JobMatch>(`/api/v1/jobs/${jobId}/match`),
  });

  const { data: job } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => api.get<Job>(`/api/v1/jobs/${jobId}`),
    enabled: !match,
  });

  const currentJob = match?.job || job;
  const isSaved = false; // Would check from saved jobs

  const handleSaveJob = async () => {
    try {
      await api.post(`/api/v1/jobs/${jobId}/save`, {});
      toast({ title: "Job saved", description: "Added to your saved jobs" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const formatSalary = (job: Job) => {
    if (!job.salary_min && !job.salary_max) return "Not specified";
    const min = job.salary_min ? `$${(job.salary_min / 1000).toFixed(0)}k` : "";
    const max = job.salary_max ? `$${(job.salary_max / 1000).toFixed(0)}k` : "";
    return min && max ? `${min} - ${max} ${job.salary_currency}` : `${min || max} ${job.salary_currency}`;
  };

  if (!currentJob) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-primary-foreground/10 rounded w-1/4" />
          <div className="h-4 bg-primary-foreground/10 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Jobs
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h1 className="text-2xl font-bold">{currentJob.title}</h1>
                    {match && (
                      <Badge variant={match.score >= 80 ? "success" : match.score >= 60 ? "warning" : "default"} className="text-lg px-3 py-1">
                        {match.score}% Match
                      </Badge>
                    )}
                  </div>
                  <p className="text-accent text-lg font-medium">{currentJob.company}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleSaveJob}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Save
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={currentJob.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Original
                    </a>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {currentJob.is_remote ? "Remote" : currentJob.location || "Not specified"}
                </span>
                {currentJob.employment_type && (
                  <Badge variant="secondary" className="capitalize">{currentJob.employment_type.replace("_", " ")}</Badge>
                )}
                {currentJob.experience_level && (
                  <Badge variant="secondary" className="capitalize">{currentJob.experience_level}</Badge>
                )}
                <span className="flex items-center gap-1 font-medium">
                  <DollarSign className="h-4 w-4" />
                  {formatSalary(currentJob)}
                </span>
                {currentJob.posted_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Posted {new Date(currentJob.posted_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              <Separator />

              <Tabs defaultValue="description" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="requirements">Requirements</TabsTrigger>
                  {match && <TabsTrigger value="match">Why This Matches</TabsTrigger>}
                </TabsList>

                <TabsContent value="description">
                  <div className="prose prose-invert max-w-none">
                    <p className="whitespace-pre-wrap">{currentJob.description}</p>
                  </div>
                </TabsContent>

                <TabsContent value="requirements">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Required Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {currentJob.skills?.map((skill) => (
                          <Badge key={skill.id} variant="outline">{skill.name}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {match && (
                  <TabsContent value="match">
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium mb-4 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Match Breakdown
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Skill Match</span>
                              <span className="font-semibold">{match.explanation.skill_match.score}%</span>
                            </div>
                            <Progress value={match.explanation.skill_match.score} className="bg-green-500" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Experience Match</span>
                              <span className="font-semibold">{match.explanation.experience_match.score}%</span>
                            </div>
                            <Progress value={match.explanation.experience_match.score} className="bg-amber-500" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Semantic Similarity</span>
                              <span className="font-semibold">{match.explanation.embedding_match.score}%</span>
                            </div>
                            <Progress value={match.explanation.embedding_match.score} className="bg-blue-500" />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Matched Skills ({match.explanation.skill_match.matched.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {match.explanation.skill_match.matched.map((skill: string) => (
                            <Badge key={skill} variant="success">{skill}</Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          Missing Skills ({match.explanation.skill_match.missing.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {match.explanation.skill_match.missing.map((skill: string) => (
                            <Badge key={skill} variant="warning">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>

          {match && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Interview Preparation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Button variant="outline" asChild className="h-20 flex flex-col items-center justify-center gap-2">
                    <a href={`/interviews/prepare?jobId=${jobId}`}>
                      <Brain className="h-8 w-8" />
                      AI Mock Interview
                    </a>
                  </Button>
                  <Button variant="outline" asChild className="h-20 flex flex-col items-center justify-center gap-2">
                    <a href={`/applications/prepare?jobId=${jobId}`}>
                      <Briefcase className="h-8 w-8" />
                      Prepare Application
                    </a>
                  </Button>
                  <Button variant="default" asChild className="h-20 flex flex-col items-center justify-center gap-2">
                    <a href={`/interviews/new?jobId=${jobId}`}>
                      <Sparkles className="h-8 w-8" />
                      Start Interview
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/applications/prepare?jobId=${jobId}`)}>
                <Briefcase className="mr-2 h-4 w-4" />
                Prepare Application
              </Button>
              <Button variant="default" className="w-full justify-start" onClick={() => router.push(`/interviews/new?jobId=${jobId}`)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Start AI Interview
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href={currentJob.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Apply on Company Site
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Company Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Building2 className="h-10 w-10 text-accent" />
                <div>
                  <p className="font-medium">{currentJob.company}</p>
                  <p className="text-sm text-muted-foreground">Source: {currentJob.provider}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                This job was sourced from {currentJob.provider}. Click "Apply on Company Site" to visit the original posting.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}