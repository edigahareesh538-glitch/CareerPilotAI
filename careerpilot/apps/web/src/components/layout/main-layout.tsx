"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { ReactNode } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-primary">
      <Sidebar />
      <div className="lg:ml-64">
        <Header />
        <main className="p-4 md:p-6 lg:p-8" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}