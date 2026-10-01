"use client";

import { useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { useAuthStore } from "@/lib/auth-store";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  // No login is required to use the app. We still fetch the current
  // (guest/demo) user once so the header and sidebar can show a name.
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <MainLayout>{children}</MainLayout>;
}
