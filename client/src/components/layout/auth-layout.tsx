import { Outlet } from "react-router-dom";

import { ModeToggle } from "@/theme/mode-toggle";

export function AuthLayout() {
  return (
    <div className="relative min-h-screen bg-muted/30">
      <div className="absolute right-4 top-4">
        <ModeToggle />
      </div>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
