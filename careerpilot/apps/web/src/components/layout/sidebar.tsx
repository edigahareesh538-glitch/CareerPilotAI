"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  FolderOpen,
  Mic2,
  GraduationCap,
  Bot,
  User,
  Settings,
  FileText,
  Target,
  Brain,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/auth-store";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Jobs", href: "/jobs", icon: Briefcase },
  { name: "Applications", href: "/applications", icon: FolderOpen },
  { name: "Interviews", href: "/interviews", icon: Mic2 },
  { name: "Learning", href: "/learning", icon: GraduationCap },
  { name: "AI Career Coach", href: "/coach", icon: Bot },
  { name: "Profile", href: "/profile", icon: User },
];

const secondaryNavigation = [
  { name: "Resume", href: "/resume", icon: FileText },
  { name: "Skill Gaps", href: "/skill-gaps", icon: Target },
  { name: "Assessments", href: "/assessments", icon: Brain },
  { name: "Agent Activity", href: "/agent-activity", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-primary-foreground/10 bg-primary/95 transition-transform lg:translate-x-0">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between border-b border-primary-foreground/10 px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-accent">
            <Brain className="h-6 w-6" />
            CareerPilot AI
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4 overflow-y-auto" role="navigation" aria-label="Main navigation">
          <div>
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Main</h3>
            <ul className="mt-2 space-y-1" role="list">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-accent/10 text-accent"
                        : "text-primary-foreground/70 hover:bg-primary/10 hover:text-primary-foreground"
                    )}
                    aria-current={pathname === item.href ? "page" : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <Separator className="my-4" />

          <div>
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">More</h3>
            <ul className="mt-2 space-y-1" role="list">
              {secondaryNavigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-accent/10 text-accent"
                        : "text-primary-foreground/70 hover:bg-primary/10 hover:text-primary-foreground"
                    )}
                    aria-current={pathname === item.href ? "page" : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="border-t border-primary-foreground/10 p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar_url || ""} alt={user?.full_name || ""} />
                  <AvatarFallback>{user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <div className="text-left flex-1 truncate">
                  <p className="text-sm font-medium truncate">{user?.full_name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex w-full items-center justify-between">
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex w-full items-center justify-between">
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}