"use client";

import { useState } from "react";
import { Brain, GraduationCap, BookOpen, Target, Clock, CheckCircle, Play, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface LearningPlan {
  id: string;
  target_role: string;
  status: string;
  plan_json: {
    weeks: Array<{
      week: number;
      focus: string;
      skills: string[];
      resources: Array<{ title: string; url: string; type: string }>;
      milestones: string[];
    }>;
  };
  generated_at: string;
  progress: Array<{ skill_id: string; status: string }>;
}

interface Skill {
  id: string;
  name: string;
  category: string;
}

export default function LearningPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"plans" | "skills" | "progress">("plans");

  const { data: plans } = useQuery({
    queryKey: ["learning-plans"],
    queryFn: () => api.get<LearningPlan[]>("/api/v1/learning/plans"),
  });

  const { data: skills } = useQuery({
    queryKey: ["skills"],
    queryFn: () => api.get<Skill[]>("/api/v1/skills"),
  });

  const handleGeneratePlan = async () => {
    try {
      const response = await api.post<LearningPlan>("/api/v1/learning/plans", {
        target_role: "AI Engineer",
        plan_json: {},
      });
      toast({ title: "Learning plan generated", description: "Your personalized roadmap is ready" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Roadmap</h1>
          <p className="text-muted-foreground">Personalized skill development plans based on your career goals</p>
        </div>
        <Button onClick={handleGeneratePlan}>
          <Plus className="mr-2 h-4 w-4" />
          Generate New Plan
        </Button>
      </div>

      <Tabs defaultValue="plans" onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">My Plans</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="skills">Skill Library</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          {plans?.length ? (
            <div className="space-y-4">
              {plans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{plan.target_role} Roadmap</CardTitle>
                        <p className="text-sm text-muted-foreground">Generated {new Date(plan.generated_at).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={plan.status === "active" ? "success" : "secondary"}>
                        {plan.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {plan.plan_json.weeks?.map((week: any) => (
                      <div key={week.week} className="p-4 rounded-lg border border-primary-foreground/10">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Week {week.week}: {week.focus}</h4>
                          <Badge variant="outline">{week.skills?.length || 0} skills</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {week.skills?.slice(0, 5).map((skill: string) => (
                            <Badge key={skill} variant="secondary">{skill}</Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          {week.resources?.slice(0, 2).map((resource: any) => (
                            <Button key={resource.title} variant="ghost" size="sm" asChild>
                              <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                <BookOpen className="mr-1 h-3 w-3" />
                                {resource.title}
                              </a>
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No learning plans yet</h3>
                <p className="mt-2 text-muted-foreground">Generate your first personalized learning roadmap</p>
                <Button className="mt-4" onClick={handleGeneratePlan}>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="progress">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {skills?.slice(0, 12).map((skill) => (
              <Card key={skill.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{skill.name}</h4>
                    <Badge variant="secondary">{skill.category}</Badge>
                  </div>
                  <Progress value={Math.floor(Math.random() * 100)} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Not Started</span>
                    <span>In Progress</span>
                    <span>Completed</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="skills">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {skills?.slice(0, 20).map((skill) => (
              <Card key={skill.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{skill.name}</h4>
                      <p className="text-sm text-muted-foreground">{skill.category}</p>
                    </div>
                    <Badge variant="outline">Learn</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}