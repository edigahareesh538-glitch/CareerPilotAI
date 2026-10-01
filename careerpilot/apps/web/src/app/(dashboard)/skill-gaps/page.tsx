"use client";

import { useState } from "react";
import { Target, AlertCircle, CheckCircle, BookOpen, TrendingUp, Brain, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface SkillGap {
  skill: { id: string; name: string; category: string };
  importance: number;
  user_level: number;
  gap: number;
  reason: string;
  learning_resources: Array<{ title: string; url: string; type: string }>;
}

interface Skill {
  id: string;
  name: string;
  category: string;
}

export default function SkillGapsPage() {
  const [activeTab, setActiveTab] = useState<"gaps" | "matrix" | "all-skills">("gaps");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const { data: gaps } = useQuery({
    queryKey: ["skill-gaps"],
    queryFn: () => api.get<SkillGap[]>("/api/v1/skill-gaps"),
  });

  const { data: skills } = useQuery({
    queryKey: ["skills"],
    queryFn: () => api.get<Skill[]>("/api/v1/skills"),
  });

  const categories = ["all", "programming", "framework", "database", "cloud", "tool", "ai_ml", "soft", "language"];

  const filteredGaps = gaps?.filter((gap) => filterCategory === "all" || gap.skill.category === filterCategory) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-8 w-8 text-accent" />
            Skill Gap Analysis
          </h1>
          <p className="text-muted-foreground">Identify missing skills and prioritize your learning</p>
        </div>
      </div>

      <Tabs defaultValue="gaps" onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="gaps">Priority Gaps</TabsTrigger>
          <TabsTrigger value="matrix">Skill Matrix</TabsTrigger>
          <TabsTrigger value="all-skills">All Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="gaps">
          <div className="flex items-center justify-between mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Category: {filterCategory === "all" ? "All" : filterCategory}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                {categories.map((cat) => (
                  <DropdownMenuItem key={cat} onClick={() => setFilterCategory(cat)} className="capitalize">
                    {cat === "all" ? "All Categories" : cat.replace("_", " ")}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent            </DropdownMenu>
          </div>

          {filteredGaps.length ? (
            <div className="space-y-4">
              {filteredGaps.map((gap) => (
                <Card key={gap.skill.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="font-semibold text-lg">{gap.skill.name}</h3>
                          <Badge variant="secondary">{gap.skill.category}</Badge>
                          <Badge variant={gap.gap > 70 ? "destructive" : gap.gap > 40 ? "warning" : "success"}>
                            Gap: {gap.gap}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{gap.reason}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Your Level</span>
                            <span className="font-medium">{gap.user_level}%</span>
                          </div>
                          <Progress value={gap.user_level} className="h-2" />
                          <div className="flex justify-between text-sm">
                            <span>Required Level</span>
                            <span className="font-medium">{gap.importance}%</span>
                          </div>
                          <Progress value={gap.importance} className="h-2 bg-amber-500" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button variant="outline" size="sm" asChild>
                          <a href={gap.learning_resources[0]?.url || "#"} target="_blank" rel="noopener noreferrer">
                            <BookOpen className="mr-2 h-4 w-4" />
                            Learn
                          </a>
                        </Button>
                        <Button variant="default" size="sm">
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Add to Plan
                        </Button>
                      </div>
                    </div>
                    {gap.learning_resources.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {gap.learning_resources.slice(0, 3).map((resource) => (
                          <Button key={resource.title} variant="ghost" size="sm" asChild>
                            <a href={resource.url} target="_blank" rel="noopener noreferrer">
                              {resource.title}
                            </a>
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="mt-4 text-lg font-medium">No significant skill gaps!</h3>
                <p className="mt-2 text-muted-foreground">You're well-prepared for your target roles</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="matrix">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {skills?.slice(0, 18).map((skill) => {
              const userLevel = Math.floor(Math.random() * 100);
              const requiredLevel = Math.floor(Math.random() * 100);
              const gap = Math.max(0, requiredLevel - userLevel);
              return (
                <Card key={skill.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{skill.name}</h4>
                      <Badge variant="secondary">{skill.category}</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current</span>
                        <span className="font-medium">{userLevel}%</span>
                      </div>
                      <Progress value={userLevel} className="h-1.5" />
                      <div className="flex justify-between text-sm">
                        <span>Target</span>
                        <span className="font-medium">{requiredLevel}%</span>
                      </div>
                      <Progress value={requiredLevel} className="h-1.5 bg-amber-500" />
                      <div className="flex justify-between text-sm">
                        <span className={gap > 30 ? "text-destructive" : "text-green-500"}>Gap</span>
                        <span className="font-medium">{gap}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="all-skills">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {skills?.map((skill) => (
              <Card key={skill.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{skill.name}</h4>
                      <p className="text-sm text-muted-foreground">{skill.category}</p>
                    </div>
                    <Badge variant="outline">View</Badge>
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