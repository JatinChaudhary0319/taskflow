import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthLayout } from "@/components/layout/auth-layout";
import { AppShell } from "@/components/layout/app-shell";
import { GuestRoute } from "@/components/routing/guest-route";
import { ProtectedRoute } from "@/components/routing/protected-route";
import { RouteErrorBoundary } from "@/components/routing/route-error-boundary";
import { AuthProvider } from "@/contexts/auth-context";
import { LoginPage } from "@/pages/login-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { ProjectDetailPage } from "@/pages/project-detail-page";
import { ProjectsPage } from "@/pages/projects-page";
import { RegisterPage } from "@/pages/register-page";

export default function App() {
  return (
    <BrowserRouter>
      <RouteErrorBoundary>
        <AuthProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <AuthLayout />
                </GuestRoute>
              }
            >
              <Route index element={<LoginPage />} />
            </Route>
            <Route
              path="/register"
              element={
                <GuestRoute>
                  <AuthLayout />
                </GuestRoute>
              }
            >
              <Route index element={<RegisterPage />} />
            </Route>

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/projects" replace />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:projectId" element={<ProjectDetailPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </RouteErrorBoundary>
    </BrowserRouter>
  );
}
