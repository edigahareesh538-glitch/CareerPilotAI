"use client";

import { useState } from "react";
import { User, Bell, Shield, Palette, Database, Trash2, Loader2, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react/query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/auth-store";

interface Settings {
  notifications: {
    email: boolean;
    push: boolean;
    job_matches: boolean;
    application_updates: boolean;
    interview_reminders: boolean;
    learning_milestones: boolean;
  };
  privacy: {
    profile_visibility: "public" | "private" | "connections";
    show_email: boolean;
    show_location: boolean;
    data_retention_days: number;
  };
  appearance: {
    theme: "light" | "dark" | "system";
    compact_mode: boolean;
  };
}

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"notifications" | "privacy" | "appearance" | "account">("notifications");
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState<Settings>({
    notifications: {
      email: true,
      push: true,
      job_matches: true,
      application_updates: true,
      interview_reminders: true,
      learning_milestones: true,
    },
    privacy: {
      profile_visibility: "private",
      show_email: false,
      show_location: true,
      data_retention_days: 365,
    },
    appearance: {
      theme: "system",
      compact_mode: false,
    },
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Settings) => api.patch("/api/v1/settings", data),
    onSuccess: () => {
      toast({ title: "Settings saved", description: "Your preferences have been updated" });
      setIsSaving(false);
    },
    onError: (err: any) => {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
      setIsSaving(false);
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data: typeof passwordData) => api.patch("/api/v1/auth/password", data),
    onSuccess: () => {
      toast({ title: "Password updated", description: "Your password has been changed" });
      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    },
  });

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    if (!confirm("This will permanently delete all your data. Type 'DELETE' to confirm.")) return;
    
    try {
      await api.delete("/api/v1/auth/account");
      useAuthStore.getState().logout();
      toast({ title: "Account deleted", description: "Your account has been permanently deleted" });
      window.location.href = "/";
    } catch (err: any) {
      toast({ title: "Failed to delete", description: err.message, variant: "destructive" });
    }
  };

  const toggleSetting = (section: keyof Settings, key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and settings</p>
      </div>

      <Tabs defaultValue="notifications" onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch checked={settings.notifications.email} onCheckedChange={(v) => toggleSetting("notifications", "email", v)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                </div>
                <Switch checked={settings.notifications.push} onCheckedChange={(v) => toggleSetting("notifications", "push", v)} />
              </div>
              <Separator />
              <h4 className="font-medium">Notification Types</h4>
              <div className="space-y-3">
                {[
                  { key: "job_matches", label: "Job Matches", desc: "New job recommendations" },
                  { key: "application_updates", label: "Application Updates", desc: "Status changes on your applications" },
                  { key: "interview_reminders", label: "Interview Reminders", desc: "Upcoming interview notifications" },
                  { key: "learning_milestones", label: "Learning Milestones", desc: "Progress updates on your learning plan" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={settings.notifications[item.key as keyof typeof settings.notifications]}
                      onCheckedChange={(v) => toggleSetting("notifications", item.key, v)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control your data and visibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Profile Visibility</Label>
                <select
                  value={settings.privacy.profile_visibility}
                  onChange={(e) => toggleSetting("privacy", "profile_visibility", e.target.value)}
                  className="flex h-10 w-full max-w-xs rounded-md border border-primary-foreground/20 bg-primary px-3 py-2 text-sm"
                >
                  <option value="private">Private - Only visible to you</option>
                  <option value="connections">Connections - Visible to your network</option>
                  <option value="public">Public - Visible to everyone</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Email</p>
                  <p className="text-sm text-muted-foreground">Display your email on your profile</p>
                </div>
                <Switch checked={settings.privacy.show_email} onCheckedChange={(v) => toggleSetting("privacy", "show_email", v)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Location</p>
                  <p className="text-sm text-muted-foreground">Display your location on your profile</p>
                </div>
                <Switch checked={settings.privacy.show_location} onCheckedChange={(v) => toggleSetting("privacy", "show_location", v)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_retention">Data Retention (days)</Label>
                <Input
                  id="data_retention"
                  type="number"
                  value={settings.privacy.data_retention_days}
                  onChange={(e) => toggleSetting("privacy", "data_retention_days", parseInt(e.target.value))}
                  className="max-w-xs"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how CareerPilot looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <select
                  value={settings.appearance.theme}
                  onChange={(e) => toggleSetting("appearance", "theme", e.target.value)}
                  className="flex h-10 w-full max-w-xs rounded-md border border-primary-foreground/20 bg-primary px-3 py-2 text-sm"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Compact Mode</p>
                  <p className="text-sm text-muted-foreground">Reduce spacing for more content density</p>
                </div>
                <Switch checked={settings.appearance.compact_mode} onCheckedChange={(v) => toggleSetting("appearance", "compact_mode", v)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>Manage your password and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input
                    id="current_password"
                    type="password"
                    name="current_password"
                    placeholder="Enter current password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData((prev) => ({ ...prev, current_password: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    name="new_password"
                    placeholder="Enter new password (min 8 characters)"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData((prev) => ({ ...prev, new_password: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    name="confirm_password"
                    placeholder="Confirm new password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData((prev) => ({ ...prev, confirm_password: e.target.value }))}
                  />
                </div>
                <Button onClick={() => updatePasswordMutation.mutate(passwordData)} disabled={!passwordData.new_password || passwordData.new_password !== passwordData.confirm_password}>
                  <Key className="mr-2 h-4 w-4" />
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>Manage third-party login connections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-primary-foreground/10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/50 flex items-center justify-center">
                    <svg className="h-6 w-6" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  </div>
                  <div>
                    <p className="font-medium">Google</p>
                    <p className="text-sm text-muted-foreground">Connected</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Disconnect</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}