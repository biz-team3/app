import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { AppShell } from "../layouts/AppShell.jsx";
import { LoginPage } from "../features/auth/LoginPage.jsx";
import { FeedPage } from "../features/feed/FeedPage.jsx";
import { ProfilePage } from "../features/profile/ProfilePage.jsx";
import { SettingsPage } from "../features/settings/SettingsPage.jsx";
import { UserCrudPage } from "../features/users/UserCrudPage.jsx";

const PresentationModePage = lazy(() =>
  import("../features/presentation/PresentationModePage.jsx").then((module) => ({ default: module.PresentationModePage })),
);

function ProtectedRoute({ children }) {
  const { authenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen bg-white dark:bg-black" />;
  if (!authenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/presentation"
        element={
          <ProtectedRoute>
            <Suspense fallback={<div className="min-h-screen bg-[#0d1117]" />}>
              <PresentationModePage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<FeedPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/admin" element={<UserCrudPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
