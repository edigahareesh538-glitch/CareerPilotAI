"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, Search, Filter, Briefcase, MapPin, Home, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
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
  explanation: any;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export default function JobsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"matches" | "discover" | "saved">("matches");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    location: "",
    is_remote: false,
    employment_type: "",
    experience_level: "",
    min_salary: "",
  });
  const [page, setPage] = useState(1);

  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ["job-matches"],
    queryFn: () => api.get<JobMatch[]>("/api/v1/jobs/matches?limit=20&min_score=50"),
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["jobs", "search", searchQuery, filters, page],
    queryFn: () => api.get<PaginatedResponse<Job>>(
      `/api/v1/jobs/search?query=${searchQuery}&location=${filters.location}&is_remote=${filters.is_remote}&employment_type=${filters.employment_type}&experience_level=${filters.experience_level}&min_salary=${filters.min_salary}&page=${page}&page_size=20`
    ),
    enabled: activeTab === "discover",
  });

  const { data: savedJobs } = useQuery({
    queryKey: ["saved-jobs"],
    queryFn: () => api.get<Job[]>("/api/v1/jobs/saved"),
    enabled: activeTab === "saved",
  });

  const handleDiscoverJobs = async () => {
    try {
      await api.get("/api/v1/jobs/discover?provider=mock&limit=20");
      toast({ title: "Discovering jobs...", description: "Fetching latest jobs from providers" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleSaveJob = async (jobId: string) => {
    try {
      await api.post(`/api/v1/jobs/${jobId}/save`, {});
      toast({ title: "Job saved", description: "Added to your saved jobs" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleUnsaveJob = async (jobId: string) => {
    try {
      await api.delete(`/api/v1/jobs/${jobId}/save`);
      toast({ title: "Job removed", description: "Removed from saved jobs" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const formatSalary = (job: Job) => {
    if (!job.salary_min && !job.salary_max) return "Not specified";
    const min = job.salary_min ? `$${(job.salary_min / 1000).toFixed(0)}k` : "";
    const max = job.salary_max ? `$${(job.salary_max / 1000).toFixed(0)}k` : "";
    return min && max ? `${min} - ${max}` : min || max;
  };

  const renderJobCard = (job: Job, matchScore?: number) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="font-semibold text-lg truncate">{job.title}</h3>
              {matchScore && (
                <Badge variant={matchScore >= 80 ? "success" : matchScore >= 60 ? "warning" : "default"}>
                  {matchScore}% Match
                </Badge>
              )}
            </div>
            <p className="text-accent font-medium">{job.company}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {job.is_remote ? "Remote" : job.location || "Not specified"}
          </span>
          {job.employment_type && (
            <Badge variant="secondary" className="capitalize">{job.employment_type.replace("_", " ")}</Badge>
          )}
          {job.experience_level && (
            <Badge variant="secondary" className="capitalize">{job.experience_level}</Badge>
          )}
          {formatSalary(job) !== "Not specified" && (
            <span className="flex items-center gap-1 font-medium">${formatSalary(job)}</span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {job.skills?.slice(0, 6).map((skill) => (
            <Badge key={skill.id} variant="outline">{skill.name}</Badge>
          ))}
          {job.skills && job.skills.length > 6 && (
            <Badge variant="outline">+{job.skills.length - 6} more</Badge>
          )}
        </div>

        <p className="text-sm line-clamp-2 text-muted-foreground">{job.description.slice(0, 200)}...</p>

        <div className="flex items-center justify-between pt-2 border-t border-primary-foreground/10">
          <Button variant="outline" size="sm" asChild>
            <a href={job.url} target="_blank" rel="noopener noreferrer">View Original</a>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/jobs/${job.id}`)}>
              Details
            </Button>
            {matchScore && (
              <Button variant="default" size="sm" onClick={() => router.push(`/applications/prepare?jobId=${job.id}`)}>
                Prepare Application
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">Discover and match with your ideal opportunities</p>
        </div>
        <Button onClick={handleDiscoverJobs} disabled={activeTab !== "discover"}>
          <Brain className="mr-2 h-4 w-4" />
          Discover New Jobs
        </Button>
      </div>

      <div className="flex gap-2 border-b border-primary-foreground/10">
        {[
          { id: "matches", label: "My Matches", icon: Brain },
          { id: "discover", label: "Discover", icon: Briefcase },
          { id: "saved", label: "Saved", icon: Home },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            onClick={() => setActiveTab(tab.id as any)}
            className="gap-2"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "discover" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search jobs, companies, skills..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="pl-10"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Location</label>
                      <Input placeholder="City, State" value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Experience Level</label>
                      <select
                        value={filters.experience_level}
                        onChange={(e) => setFilters({ ...filters, experience_level: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-primary-foreground/20 bg-primary px-3 py-2 text-sm"
                      >
                        <option value="">All Levels</option>
                        <option value="entry">Entry</option>
                        <option value="junior">Junior</option>
                        <option value="mid">Mid</option>
                        <option value="senior">Senior</option>
                        <option value="lead">Lead</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="remote-filter"
                        checked={filters.is_remote}
                        onChange={(e) => setFilters({ ...filters, is_remote: e.target.checked })}
                        className="h-4 w-4 rounded border-primary-foreground/20"
                      />
                      <label htmlFor="remote-filter" className="text-sm">Remote only</label>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      )}

      <div className={matchesLoading || jobsLoading ? "opacity-50" : ""}>
        {activeTab === "matches" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {matches?.map((match) => renderJobCard(match.job, match.score))}
          </div>
        )}

        {activeTab === "discover" && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {jobs?.items.map((job) => renderJobCard(job))}
            </div>
            {jobs && jobs.total > jobs.items.length && (
              <div className="flex justify-center gap-2 mt-6">
                <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="flex items-center px-4 text-sm">
                  Page {page} of {Math.ceil(jobs.total / 20)}
                </span>
                <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(jobs.total / 20)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {activeTab === "saved" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {savedJobs?.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{job.title}</h3>
                      <p className="text-accent font-medium">{job.company}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleUnsaveJob(job.id)}>
                      <svg className="h-5 w-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.is_remote ? "Remote" : job.location || "Not specified"}
                    </span>
                    {job.employment_type && <Badge variant="secondary" className="capitalize">{job.employment_type.replace("_", " ")}</Badge>}
                    {job.experience_level && <Badge variant="secondary" className="capitalize">{job.experience_level}</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {job.skills?.slice(0, 6).map((skill) => (
                      <Badge key={skill.id} variant="outline">{skill.name}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-primary-foreground/10">
                    <Button variant="outline" size="sm" asChild>
                      <a href={job.url} target="_blank" rel="noopener noreferrer">View Original</a>
                    </Button>
                    <Button variant="default" size="sm" onClick={() => router.push(`/jobs/${job.id}`)}>
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {(matchesLoading && activeTab === "matches") || (jobsLoading && activeTab === "discover") ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-primary-foreground/10 rounded w-3/4" />
                  <div className="h-3 bg-primary-foreground/10 rounded w-1/2" />
                  <div className="h-3 bg-primary-foreground/10 rounded w-1/3" />
                  <div className="h-3 bg-primary-foreground/10 rounded w-1/4" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-primary-foreground/10 rounded-full w-20" />
                    <div className="h-6 bg-primary-foreground/10 rounded-full w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : matches?.length === 0 && jobs?.items.length === 0 && savedJobs?.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Brain className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No jobs found</h3>
            <p className="mt-2 text-muted-foreground">
              {activeTab === "matches"
                ? "Upload your resume to get personalized job matches"
                : activeTab === "discover"
                ? "Try adjusting your search or click 'Discover New Jobs'"
                : "Save jobs from the Discover or Matches tabs"}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}