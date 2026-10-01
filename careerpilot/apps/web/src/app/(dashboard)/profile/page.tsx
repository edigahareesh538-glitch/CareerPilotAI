"use client";

import { useState } from "react";
import { User, Mail, MapPin, Briefcase, Target, Globe, Linkedin, Github, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/auth-store";

interface Profile {
  headline: string | null;
  location: string | null;
  experience_level: string | null;
  target_roles: string[];
  target_locations: string[];
  preferences: Record<string, any>;
  bio: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<Profile>("/api/v1/profile"),
  });

  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    headline: profile?.headline || "",
    location: profile?.location || "",
    experience_level: profile?.experience_level || "",
    target_roles: profile?.target_roles?.join(", ") || "",
    target_locations: profile?.target_locations?.join(", ") || "",
    bio: profile?.bio || "",
    linkedin_url: profile?.linkedin_url || "",
    github_url: profile?.github_url || "",
    portfolio_url: profile?.portfolio_url || "",
  });

  const [isSaving, setIsSaving] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof formData) => api.patch("/api/v1/profile", {
      headline: data.headline,
      location: data.location,
      experience_level: data.experience_level,
      target_roles: data.target_roles.split(",").map((s) => s.trim()).filter(Boolean),
      target_locations: data.target_locations.split(",").map((s) => s.trim()).filter(Boolean),
      bio: data.bio,
      linkedin_url: data.linkedin_url,
      github_url: data.github_url,
      portfolio_url: data.portfolio_url,
    }),
    onSuccess: (updatedProfile) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setUser({ ...user!, ...updatedProfile });
      toast({ title: "Profile saved", description: "Your profile has been updated" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    },
    onSettled: () => setIsSaving(false),
  });

  const handleSubmit = () => {
    setIsSaving(true);
    updateProfileMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const experienceLevels = ["entry", "junior", "mid", "senior", "lead", "principal", "executive"];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your professional profile and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.avatar_url || ""} alt={user?.full_name || ""} />
              <AvatarFallback className="text-2xl">{user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{user?.full_name || "User"}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground">Member since {new Date(user?.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full sm:w-auto">
            <User className="mr-2 h-4 w-4" />
            Change Avatar
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="career">Career</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user?.email || ""} disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headline">Professional Headline</Label>
              <Input
                id="headline"
                name="headline"
                placeholder="Senior AI Engineer | ML Specialist"
                value={formData.headline}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                className="flex min-h-[100px] w-full rounded-md border border-primary-foreground/20 bg-primary px-3 py-2 text-sm"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" placeholder="San Francisco, CA" value={formData.location} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience_level">Experience Level</Label>
                <select
                  id="experience_level"
                  name="experience_level"
                  value={formData.experience_level}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-primary-foreground/20 bg-primary px-3 py-2 text-sm"
                >
                  <option value="">Select level</option>
                  {experienceLevels.map((level) => (
                    <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="career">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target_roles">Target Roles</Label>
              <Input
                id="target_roles"
                name="target_roles"
                placeholder="AI Engineer, ML Engineer, Data Scientist (comma separated)"
                value={formData.target_roles}
                onChange={handleChange}
              />
              <p className="text-sm text-muted-foreground">Enter your target job titles, separated by commas</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_locations">Preferred Locations</Label>
              <Input
                id="target_locations"
                name="target_locations"
                placeholder="San Francisco, Remote, New York (comma separated)"
                value={formData.target_locations}
                onChange={handleChange}
              />
              <p className="text-sm text-muted-foreground">Enter preferred work locations, separated by commas</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="links">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Linkedin className="h-4 w-4" />
                </span>
                <Input
                  id="linkedin_url"
                  name="linkedin_url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={formData.linkedin_url}
                  onChange={handleChange}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="github_url">GitHub Profile</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Github className="h-4 w-4" />
                </span>
                <Input
                  id="github_url"
                  name="github_url"
                  placeholder="https://github.com/yourusername"
                  value={formData.github_url}
                  onChange={handleChange}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="portfolio_url">Portfolio / Website</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                </span>
                <Input
                  id="portfolio_url"
                  name="portfolio_url"
                  placeholder="https://yourportfolio.com"
                  value={formData.portfolio_url}
                  onChange={handleChange}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setFormData({
          full_name: user?.full_name || "",
          headline: profile?.headline || "",
          location: profile?.location || "",
          experience_level: profile?.experience_level || "",
          target_roles: profile?.target_roles?.join(", ") || "",
          target_locations: profile?.target_locations?.join(", ") || "",
          bio: profile?.bio || "",
          linkedin_url: profile?.linkedin_url || "",
          github_url: profile?.github_url || "",
          portfolio_url: profile?.portfolio_url || "",
        })}>
          Reset
        </Button>
        <Button onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}