"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";

const steps = [
  { id: "role", title: "Target Role", description: "What role are you targeting?" },
  { id: "experience", title: "Experience", description: "What's your experience level?" },
  { id: "location", title: "Location", description: "Where do you want to work?" },
  { id: "skills", title: "Skills", description: "What are your core skills?" },
  { id: "goals", title: "Goals", description: "What are your career goals?" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    target_role: "",
    experience_level: "",
    target_locations: "",
    skills: "",
    career_goals: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.patch("/api/v1/profile", {
        target_roles: formData.target_role ? [formData.target_role] : [],
        experience_level: formData.experience_level,
        target_locations: formData.target_locations.split(",").map((s) => s.trim()).filter(Boolean),
        preferences: {
          skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
          career_goals: formData.career_goals,
        },
      });
      const updatedUser = await api.get("/api/v1/auth/me");
      setUser(updatedUser);
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Onboarding failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="inline-flex items-center gap-2 justify-center mb-4 font-bold text-xl text-accent">
            <Brain className="h-7 w-7" />
            CareerPilot AI
          </div>
          <CardTitle>Let's personalize your experience</CardTitle>
          <CardDescription>Tell us about yourself so we can tailor your career journey</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            {steps.map((s, i) => (
              <span key={s.id} className={i === currentStep ? "font-medium text-primary-foreground" : ""}>
                {i + 1}. {s.title}
              </span>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={step.id}>{step.title}</Label>
              <p className="text-sm text-muted-foreground">{step.description}</p>

              {step.id === "role" && (
                <Input
                  id="role"
                  placeholder="e.g., AI Engineer, ML Engineer, Data Scientist"
                  value={formData.target_role}
                  onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                />
              )}

              {step.id === "experience" && (
                <select
                  id="experience"
                  value={formData.experience_level}
                  onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-primary-foreground/20 bg-primary px-3 py-2 text-sm ring-offset-primary file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select experience level</option>
                  <option value="entry">Entry Level (0-1 years)</option>
                  <option value="junior">Junior (1-2 years)</option>
                  <option value="mid">Mid Level (3-5 years)</option>
                  <option value="senior">Senior (5-8 years)</option>
                  <option value="lead">Lead (8+ years)</option>
                  <option value="principal">Principal (10+ years)</option>
                </select>
              )}

              {step.id === "location" && (
                <Input
                  id="location"
                  placeholder="e.g., San Francisco, Remote, New York (comma separated)"
                  value={formData.target_locations}
                  onChange={(e) => setFormData({ ...formData, target_locations: e.target.value })}
                />
              )}

              {step.id === "skills" && (
                <Input
                  id="skills"
                  placeholder="e.g., Python, PyTorch, Docker, AWS, SQL (comma separated)"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                />
              )}

              {step.id === "goals" && (
                <textarea
                  id="goals"
                  className="flex min-h-[100px] w-full rounded-md border border-primary-foreground/20 bg-primary px-3 py-2 text-sm ring-offset-primary placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe your career goals..."
                  value={formData.career_goals}
                  onChange={(e) => setFormData({ ...formData, career_goals: e.target.value })}
                />
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={handleBack} disabled={currentStep === 0}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {currentStep === steps.length - 1 ? "Complete Setup" : "Next"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}