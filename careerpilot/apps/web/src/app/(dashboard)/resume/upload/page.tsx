"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function ResumeUploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (newFile: File | null) => {
    if (!newFile) return;
    setError(null);
    if (!ALLOWED_TYPES.includes(newFile.type)) {
      setError("Only PDF and DOCX files are allowed");
      return;
    }
    if (newFile.size > MAX_SIZE) {
      setError("File size must be less than 10MB");
      return;
    }
    setFile(newFile);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.upload<{ id: string; status: string }>("/api/v1/resumes/upload", formData);
      
      // Poll for parsing completion
      await pollResumeStatus(response.id);
      
      toast({ title: "Resume uploaded!", description: "Your resume has been analyzed." });
      router.push("/resume/analysis");
    } catch (err: any) {
      setError(err.message || "Upload failed");
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const pollResumeStatus = async (resumeId: string) => {
    for (let i = 0; i < 30; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        const resume = await api.get<any>(`/api/v1/resumes/${resumeId}`);
        if (resume.status === "parsed") {
          const version = await api.get<any>(`/api/v1/resumes/${resumeId}/active-version`);
          setAnalysis(version.parsed_json);
          return;
        } else if (resume.status === "failed") {
          throw new Error(resume.error_message || "Parsing failed");
        }
      } catch (err) {
        if (i === 29) throw err;
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Resume</h1>
        <p className="text-muted-foreground">Upload your resume to get AI-powered analysis and job matches</p>
      </div>

      <Card className={dragActive ? "border-accent/50 bg-accent/5" : ""}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-accent" />
            <CardTitle>Drop your resume here</CardTitle>
          </div>
          <CardDescription>
            PDF or DOCX, max 10MB. We'll extract your skills, experience, and create your career profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragActive ? "border-accent bg-accent/5" : "border-primary-foreground/10"}
              ${file ? "hidden" : ""}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && document.getElementById("file-input")?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => handleFileChange(e.target.files[0])}
              className="hidden"
              aria-label="Upload resume"
            />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">Drag & drop your resume here</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
            <p className="mt-2 text-xs text-muted-foreground">PDF, DOCX · Max 10MB</p>
          </div>

          {file && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-primary-foreground/10">
                <div className="flex items-center gap-4">
                  <FileText className="h-10 w-10 text-accent" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleRemoveFile}>
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </Button>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {!isUploading && !analysis && (
                <Button onClick={handleUpload} className="w-full" size="lg">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Analyze
                </Button>
              )}

              {error && (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {analysis && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <CardTitle>Analysis Complete!</CardTitle>
            </div>
            <CardDescription>Your resume has been processed. Here's what we found:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Candidate Info</h4>
                <p><strong>Name:</strong> {analysis.candidate?.name || "Not detected"}</p>
                <p><strong>Email:</strong> {analysis.candidate?.email || "Not detected"}</p>
                <p><strong>Location:</strong> {analysis.candidate?.location || "Not detected"}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Experience</h4>
                <p><strong>Years:</strong> {analysis.years_experience || 0}</p>
                <p><strong>Target Roles:</strong> {analysis.target_roles?.join(", ") || "Not specified"}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Technical Skills ({analysis.technical_skills?.length || 0})</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.technical_skills?.slice(0, 15).map((skill: string) => (
                  <Badge key={skill} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Experience ({analysis.candidate?.experience?.length || 0} entries)</h4>
              <ul className="space-y-1">
                {analysis.candidate?.experience?.slice(0, 3).map((exp: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground">{exp}</li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => router.push("/dashboard")} size="lg">
                Continue to Dashboard
                <Brain className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}