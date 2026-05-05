import { useCallback, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { getNotificationSummary } from "../api/notificationsApi.js";
import { CreatePostModal } from "../components/modals/CreatePostModal.jsx";
import { ProfileEditModal } from "../components/modals/ProfileEditModal.jsx";
import { NotificationPanel } from "../components/panels/NotificationPanel.jsx";
import { Sidebar } from "../components/navigation/Sidebar.jsx";
import { MobileHeader } from "../components/navigation/MobileHeader.jsx";
import { BottomNav } from "../components/navigation/BottomNav.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useTheme } from "../hooks/useTheme.js";

export function AppShell() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toggleTheme } = useTheme();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [feedVersion, setFeedVersion] = useState(0);
  const [notificationBadgeCount, setNotificationBadgeCount] = useState(0);

  const refreshNotificationSummary = useCallback(async () => {
    const summary = await getNotificationSummary();
    setNotificationBadgeCount(summary.totalBadgeCount);
  }, []);

  useEffect(() => {
    refreshNotificationSummary();
  }, [refreshNotificationSummary]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleCreated = () => {
    setFeedVersion((value) => value + 1);
  };

  return (
    <div className="min-h-screen bg-white text-gray-950 transition-colors duration-300 dark:bg-black dark:text-gray-100">
      <MobileHeader onNotifications={() => setNotificationsOpen(true)} notificationBadgeCount={notificationBadgeCount} />
      <Sidebar
        onCreate={() => setCreateOpen(true)}
        onNotifications={() => setNotificationsOpen(true)}
        notificationBadgeCount={notificationBadgeCount}
        onSettings={() => setProfileEditOpen(true)}
        onThemeToggle={toggleTheme}
        onLogout={handleLogout}
      />
      <main className="min-h-screen pt-14 md:ml-20 md:pt-0 xl:ml-[244px]">
        <Outlet context={{ feedVersion, onCreated: handleCreated }} />
      </main>
      <BottomNav onCreate={() => setCreateOpen(true)} />
      <NotificationPanel isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} onChanged={refreshNotificationSummary} />
      <CreatePostModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreated={handleCreated} />
      <ProfileEditModal isOpen={profileEditOpen} onClose={() => setProfileEditOpen(false)} onSaved={handleCreated} />
    </div>
  );
}
