"use client";

import { cn } from "@/lib/utils";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/lib/auth-store";

export function Header() {
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-primary-foreground/10 bg-primary/95 px-4 backdrop-blur-sm lg:ml-64">
      <div className="flex-1 max-w-xl hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search jobs, companies, skills..."
            className="pl-10"
            aria-label="Search"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" aria-hidden="true" />
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuItem className="text-sm">
              <p className="font-medium">New job match</p>
              <p className="text-xs text-muted-foreground">AI Engineer at TechCorp AI - 94% match</p>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm">
              <p className="font-medium">Interview scheduled</p>
              <p className="text-xs text-muted-foreground">Technical interview tomorrow at 2:00 PM</p>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm">
              <p className="font-medium">Application update</p>
              <p className="text-xs text-muted-foreground">Your application to DataFlow Inc is under review</p>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatar_url || ""} alt={user?.full_name || ""} />
                <AvatarFallback className="text-sm">{user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="font-medium">{user?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <a href="/profile" className="flex w-full items-center justify-between">Profile</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/settings" className="flex w-full items-center justify-between">Settings</a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}