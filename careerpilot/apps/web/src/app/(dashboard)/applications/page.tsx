"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, Briefcase, FileText, Filter, Plus, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Application {
  id: string;
  user_id: string;
  job_id: string;
  resume_version_id: string | null;
  status: string;
  cover_letter: string | null;
  application_answers: Record<string, any>;
  submitted_at: string | null;
  external_application_id: string | null;
  notes: string | null;
  created_at: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string | null;
    is_remote: boolean;
    url: string;
  };
  resume_version?: {
    id: string;
    parsed_json: any;
  };
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" | "info" }> = {
  saved: { label: "Saved", variant: "secondary" },
  preparing: { label: "Preparing", variant: "default" },
  approval_required: { label: "Approval Required", variant: "warning" },
  applied: { label: "Applied", variant: "default" },
  assessment: { label: "Assessment", variant: "info" },
  interview: { label: "Interview", variant: "success" },
  offer: { label: "Offer", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
  withdrawn: { label: "Withdrawn", variant: "secondary" },
};

export default function ApplicationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"all" | "active" | "archived">("active");
  const [page, setPage] = useState(1);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const { data: applications, isLoading } = useQuery({
    queryKey: ["applications", activeTab, page],
    queryFn: () => api.get<PaginatedResponse<Application>>(
      `/api/v1/applications?status=${activeTab === "active" ? "saved,preparing,approval_required,applied,assessment,interview" : activeTab === "archived" ? "offer,rejected,withdrawn" : ""}&page=${page}&page_size=20`
    ),
  });

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    try {
      await api.patch(`/api/v1/applications/${appId}`, { status: newStatus });
      toast({ title: "Status updated", description: `Application moved to ${statusConfig[newStatus]?.label || newStatus}` });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleViewApplication = (app: Application) => {
    setSelectedApp(app);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const statusTabs = [
    { id: "active", label: "Active", icon: Clock },
    { id: "archived", label: "Archived", icon: XCircle },
    { id: "all", label: "All", icon: Briefcase },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground">Track and manage your job applications</p>
        </div>
        <Button onClick={() => router.push("/applications/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Application
        </Button>
      </div>

      <Tabs defaultValue="active" onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="active">
          <ApplicationsList applications={applications?.items || []} isLoading={isLoading} onView={handleViewApplication} onUpdateStatus={handleUpdateStatus} />
        </TabsContent>
        <TabsContent value="archived">
          <ApplicationsList applications={applications?.items || []} isLoading={isLoading} onView={handleViewApplication} onUpdateStatus={handleUpdateStatus} />
        </TabsContent>
        <TabsContent value="all">
          <ApplicationsList applications={applications?.items || []} isLoading={isLoading} onView={handleViewApplication} onUpdateStatus={handleUpdateStatus} />
        </TabsContent>
      </Tabs>

      {applications && applications.total > applications.items.length && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="flex items-center px-4 text-sm">Page {page} of {Math.ceil(applications.total / 20)}</span>
          <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(applications.total / 20)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {selectedApp && (
        <ApplicationDetailModal application={selectedApp} onClose={() => setSelectedApp(null)} onUpdateStatus={handleUpdateStatus} />
      )}
    </div>
  );
}

function ApplicationsList({ applications, isLoading, onView, onUpdateStatus }: {
  applications: Application[];
  isLoading: boolean;
  onView: (app: Application) => void;
  onUpdateStatus: (appId: string, status: string) => void;
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

  if (applications.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No applications yet</h3>
          <p className="mt-2 text-muted-foreground">Start applying to jobs to see them here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {applications.map((app) => (
        <Card key={app.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{app.job.title}</h3>
                <p className="text-accent font-medium text-sm">{app.job.company}</p>
              </div>
              <Badge variant={statusConfig[app.status]?.variant || "default"}>
                {statusConfig[app.status]?.label || app.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                {app.job.is_remote ? "Remote" : app.job.location || "Not specified"}
              </span>
              <span>Applied {formatDate(app.created_at)}</span>
            </div>

            {app.cover_letter && (
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => onView(app)}>
                View Cover Letter
              </Button>
            )}

            <div className="flex gap-2 pt-2 border-t border-primary-foreground/10">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => onView(app)}>
                View Details
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <DropdownMenuItem key={status} onClick={() => onUpdateStatus(app.id, status)} className="capitalize">
                      {config.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ApplicationDetailModal({ application, onClose, onUpdateStatus }: {
  application: Application;
  onClose: () => void;
  onUpdateStatus: (appId: string, status: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-primary-foreground/10 bg-primary p-6 shadow-lg">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">{application.job.title}</h2>
            <p className="text-accent">{application.job.company}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-primary-foreground">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant={statusConfig[application.status]?.variant || "default"} className="text-lg px-3 py-1">
              {statusConfig[application.status]?.label || application.status}
            </Badge>
            <div className="flex gap-2">
              {Object.entries(statusConfig).map(([status, config]) => (
                <Button key={status} variant={application.status === status ? "default" : "outline"} size="sm" onClick={() => onUpdateStatus(application.id, status)}>
                  {config.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {application.cover_letter && (
            <div>
              <h4 className="font-medium mb-2">Cover Letter</h4>
              <div className="prose prose-invert max-w-none p-4 rounded-lg border border-primary-foreground/10">
                <p className="whitespace-pre-wrap">{application.cover_letter}</p>
              </div>
            </div>
          )}

          {application.application_answers && Object.keys(application.application_answers).length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Application Answers</h4>
              <div className="space-y-3">
                {Object.entries(application.application_answers).map(([question, answer]) => (
                  <div key={question} className="p-4 rounded-lg border border-primary-foreground/10">
                    <p className="font-medium text-sm">{question}</p>
                    <p className="text-sm text-muted-foreground mt-1">{answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {application.notes && (
            <div>
              <h4 className="font-medium mb-2">Notes</h4>
              <p className="text-sm text-muted-foreground">{application.notes}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-primary-foreground/10">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button variant="default" asChild>
              <a href={application.job.url} target="_blank" rel="noopener noreferrer">
                View Original Posting
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}