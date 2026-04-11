import { Outlet } from "react-router-dom";

import { AppNavbar } from "@/components/layout/app-navbar";

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppNavbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
