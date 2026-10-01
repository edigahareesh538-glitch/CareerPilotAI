"use client";

import { useState } from "react";
import { Brain, CheckCircle, Loader2, XCircle, Clock, AlertCircle, Filter, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface AgentActivity {
  id: string;
  agent_name: string;
  action: string;
  input_ref: string | null;
  output_ref: string | null;
  status: string;
  error_message: string | null;
  metadata: Record<string, any>;
  created_at: string;
  completed_at: string | null;
}

const agentIcons: Record<string, React.ElementType> = {
  resume_analyzer: Brain,
  job_discovery: Brain,
  job_normalization: Brain,
  job_research: Brain,
  skill_matching: Brain,
  job_ranking: Brain,
  application_preparation: Brain,
  application_execution: Brain,
  career_coach: Brain,
  interviewer: Brain,
  assessment: Brain,
  notification: Brain,
};

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" | "info" }> = {
  started: { label: "Started", variant: "info" },
  completed: { label: "Completed", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
  waiting: { label: "Waiting", variant: "warning" },
  retrying: { label: "Retrying", variant: "warning" },
};

export default function AgentActivityPage() {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed" | "failed">("all");
  const [filterAgent, setFilterAgent] = useState<string>("all");

  const { data: activities, isLoading, refetch } = useQuery({
    queryKey: ["agent-activities"],
    queryFn: () => api.get<AgentActivity[]>("/api/v1/agent-activities?limit=100"),
    refetchInterval: 5000,
  });

  const agents = [
    "resume_analyzer",
    "job_discovery",
    "job_normalization",
    "job_research",
    "skill_matching",
    "job_ranking",
    "application_preparation",
    "application_execution",
    "career_coach",
    "interviewer",
    "assessment",
    "notification",
  ];

  const filteredActivities = activities?.filter((a) => {
    if (activeTab !== "all" && a.status !== activeTab) return false;
    if (filterAgent !== "all" && a.agent_name !== filterAgent) return false;
    return true;
  }) || [];

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return "—";
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const secs = Math.floor(duration / 1000);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    return `${mins}m ${secs % 60}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-accent" />
            Agent Activity Center
          </h1>
          <p className="text-muted-foreground">Monitor and understand what AI agents are doing on your behalf</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Log
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Tabs defaultValue="all" onValueChange={setActiveTab} className="flex-1">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="started">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>
        </TabsList>
        </Tabs>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Agent: {filterAgent === "all" ? "All" : filterAgent.replace("_", " ")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Filter by Agent</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setFilterAgent("all")}>All Agents</DropdownMenuItem>
            {agents.map((agent) => (
              <DropdownMenuItem key={agent} onClick={() => setFilterAgent(agent)} className="capitalize">
                {agent.replace("_", " ")}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="mx-auto h-8 w-8 text-accent animate-spin" />
              <p className="mt-2 text-muted-foreground">Loading agent activities...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-8 text-center">
              <Brain className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No agent activities found</h3>
              <p className="mt-2 text-muted-foreground">Agent activities will appear here as you use CareerPilot AI</p>
            </div>
          ) : (
            <div className="divide-y divide-primary-foreground/10">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-primary/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                        <agentIcons[activity.agent_name] className="h-5 w-5 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium truncate">{activity.agent_name.replace("_", " ")}</h4>
                          <Badge variant={statusConfig[activity.status]?.variant || "default"}>
                            {statusConfig[activity.status]?.label || activity.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatTime(activity.created_at)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{activity.action}</p>
                        {activity.error_message && (
                          <p className="text-sm text-destructive mt-1">{activity.error_message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatDuration(activity.created_at, activity.completed_at)}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <AlertCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-primary-foreground/10">
                      <details className="text-xs text-muted-foreground">
                        <summary className="cursor-pointer mb-1">Metadata</summary>
                        <pre className="p-2 rounded bg-primary-foreground/5 overflow-auto max-h-32">
                          {JSON.stringify(activity.metadata, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agent Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {agents.map((agent) => {
              const agentActivities = activities?.filter((a) => a.agent_name === agent) || [];
              const completed = agentActivities.filter((a) => a.status === "completed").length;
              const failed = agentActivities.filter((a) => a.status === "failed").length;
              const active = agentActivities.filter((a) => a.status === "started" || a.status === "waiting" || a.status === "retrying").length;
              const lastRun = agentActivities[0]?.created_at;

              return (
                <div key={agent} className="p-4 rounded-lg border border-primary-foreground/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <agentIcons[agent] className="h-5 w-5 text-accent" />
                    </div>
                    <h4 className="font-medium capitalize">{agent.replace("_", " ")}</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-500">{completed}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{active > 0 ? "●" : "○"}</p>
                      <p className="text-xs text-muted-foreground">{active > 0 ? "Active" : "Idle"}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-destructive">{failed}</p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                  </div>
                  {lastRun && (
                    <p className="text-xs text-muted-foreground mt-2">Last run: {formatTime(lastRun)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}