"use client";

import { useState } from "react";
import { Brain, FileText, Play, CheckCircle, Clock, Award, BarChart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Assessment {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  question_count: number;
  time_limit: number;
  description: string;
}

interface AssessmentResult {
  id: string;
  assessment_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken: number;
  completed_at: string;
  weak_topics: string[];
}

export default function AssessmentsPage() {
  const [activeTab, setActiveTab] = useState<"available" | "results" | "recommended">("available");

  const { data: assessments } = useQuery({
    queryKey: ["assessments"],
    queryFn: () => api.get<Assessment[]>("/api/v1/assessments"),
  });

  const { data: results } = useQuery({
    queryKey: ["assessment-results"],
    queryFn: () => api.get<AssessmentResult[]>("/api/v1/assessments/results"),
  });

  const mockAssessments: Assessment[] = [
    {
      id: "1",
      title: "Python Fundamentals",
      category: "Programming",
      difficulty: "Easy",
      question_count: 20,
      time_limit: 30,
      description: "Test your Python syntax, data structures, and basic algorithms knowledge",
    },
    {
      id: "2",
      title: "Machine Learning Concepts",
      category: "AI/ML",
      difficulty: "Medium",
      question_count: 25,
      time_limit: 45,
      description: "Supervised/unsupervised learning, model evaluation, and common algorithms",
    },
    {
      id: "3",
      title: "Deep Learning & Neural Networks",
      category: "AI/ML",
      difficulty: "Hard",
      question_count: 20,
      time_limit: 60,
      description: "CNNs, RNNs, Transformers, backpropagation, and modern architectures",
    },
    {
      id: "4",
      title: "System Design for ML",
      category: "Engineering",
      difficulty: "Medium",
      question_count: 15,
      time_limit: 45,
      description: "MLOps, model serving, feature stores, monitoring, and scaling",
    },
    {
      id: "5",
      title: "SQL for Data Science",
      category: "Data",
      difficulty: "Easy",
      question_count: 20,
      time_limit: 30,
      description: "Joins, window functions, CTEs, and query optimization",
    },
    {
      id: "6",
      title: "Cloud & DevOps for ML",
      category: "Engineering",
      difficulty: "Medium",
      question_count: 18,
      time_limit: 40,
      description: "Docker, Kubernetes, AWS/GCP, CI/CD, and infrastructure as code",
    },
  ];

  const difficultyColors: Record<string, "default" | "success" | "warning" | "destructive"> = {
    Easy: "success",
    Medium: "warning",
    Hard: "destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-accent" />
            Assessments
          </h1>
          <p className="text-muted-foreground">Test your skills and track your progress</p>
        </div>
      </div>

      <Tabs defaultValue="available" onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="available">Available Tests</TabsTrigger>
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
          <TabsTrigger value="results">My Results</TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockAssessments.map((assessment) => (
              <Card key={assessment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{assessment.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{assessment.category}</p>
                    </div>
                    <Badge variant={difficultyColors[assessment.difficulty]}>{assessment.difficulty}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{assessment.description}</p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      {assessment.question_count} questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {assessment.time_limit} min
                    </span>
                  </div>
                  <Button className="w-full" onClick={() => window.location.href = `/assessments/${assessment.id}`}>
                    <Play className="mr-2 h-4 w-4" />
                    Start Assessment
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommended">
          <Card>
            <CardHeader>
              <CardTitle>Recommended for You</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border border-primary-foreground/10">
                <div className="flex items-center gap-3">
                  <Brain className="h-8 w-8 text-accent" />
                  <div>
                    <p className="font-medium">Based on your profile</p>
                    <p className="text-sm text-muted-foreground">We recommend these assessments to identify your skill gaps</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {mockAssessments.slice(0, 3).map((assessment) => (
                  <Card key={assessment.id}>
                    <CardHeader>
                      <CardTitle>{assessment.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant={difficultyColors[assessment.difficulty]}>{assessment.difficulty}</Badge>
                      <Button className="w-full mt-2" onClick={() => window.location.href = `/assessments/${assessment.id}`}>
                        Start
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          {results?.length ? (
            <div className="space-y-4">
              {results.map((result) => (
                <Card key={result.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Assessment #{result.assessment_id}</CardTitle>
                        <p className="text-sm text-muted-foreground">Completed {new Date(result.completed_at).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={result.score >= 80 ? "success" : result.score >= 60 ? "warning" : "destructive"}>
                        {result.score}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span>{result.correct_answers}/{result.total_questions} correct</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {Math.floor(result.time_taken / 60)}m {result.time_taken % 60}s
                        </span>
                      </div>
                    </div>
                    <Progress value={result.score} className="h-2" />
                    {result.weak_topics.length > 0 && (
                      <div>
                        <p className="font-medium mb-2">Weak Topics:</p>
                        <div className="flex flex-wrap gap-2">
                          {result.weak_topics.map((topic) => (
                            <Badge key={topic} variant="destructive">{topic}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Award className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No assessment results yet</h3>
                <p className="mt-2 text-muted-foreground">Complete an assessment to see your results here</p>
                <Button className="mt-4" onClick={() => setActiveTab("available")}>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Browse Assessments
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}