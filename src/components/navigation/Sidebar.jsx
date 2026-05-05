import { useEffect, useRef, useState } from "react";
import { Bell, Camera, Home, LogOut, Menu, MoonStar, PlusCircle, Settings, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { useLanguage } from "../../hooks/useLanguage.js";

export function Sidebar({ onCreate, onNotifications, notificationBadgeCount = 0, onSettings, onThemeToggle, onLogout }) {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  const items = [
    { label: t("home"), icon: Home, path: "/" },
    { label: t("notifications"), icon: Bell, action: onNotifications, badge: notificationBadgeCount },
    { label: t("create"), icon: PlusCircle, action: onCreate },
    { label: t("profile"), icon: User, path: "/profile" },
  ];

  useEffect(() => {
    if (!moreOpen) return undefined;

    const handleClickOutside = (event) => {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setMoreOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [moreOpen]);

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`fixed left-0 top-0 z-50 hidden h-screen flex-col border-r border-gray-200 bg-white px-3 py-5 transition-all duration-300 dark:border-gray-800 dark:bg-black md:flex ${
        expanded ? "w-[244px]" : "w-20"
      }`}
    >
      <Link to="/" className="mb-8 flex h-16 items-center gap-4 rounded-xl p-3 hover:bg-gray-100 dark:hover:bg-gray-900">
        <Camera className="h-7 w-7 shrink-0" />
        <span className={`${expanded ? "opacity-100" : "w-0 opacity-0"} overflow-hidden text-[26px] transition-all`} style={{ fontFamily: "'Grand Hotel', cursive" }}>
          Instagram
        </span>
      </Link>

      <nav className="flex flex-col gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.path && (location.pathname === item.path || (item.path === "/profile" && location.pathname.startsWith("/profile")));
          const content = (
            <>
              <span className="relative shrink-0">
                <Icon className={`h-6 w-6 ${active ? "stroke-[3]" : ""}`} />
                {item.badge && <span className="absolute -right-2 -top-2 rounded-full bg-[#ff3040] px-1.5 text-[10px] font-bold text-white">{item.badge}</span>}
              </span>
              <span className={`${expanded ? "max-w-[150px] opacity-100" : "max-w-0 opacity-0"} overflow-hidden whitespace-nowrap transition-all`}>{item.label}</span>
            </>
          );
          return item.path ? (
            <Link key={item.label} to={item.path} className={`flex items-center gap-4 rounded-xl p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-900 ${active ? "font-bold" : ""}`}>
              {content}
            </Link>
          ) : (
            <button key={item.label} onClick={item.action} className="flex items-center gap-4 rounded-xl p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-900">
              {content}
            </button>
          );
        })}
      </nav>

      <div ref={moreRef} className="relative mt-auto">
        <button onClick={() => setMoreOpen((value) => !value)} className="flex w-full items-center gap-4 rounded-xl p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-900">
          <Menu className="h-6 w-6 shrink-0" />
          <span className={`${expanded ? "max-w-[150px] opacity-100" : "max-w-0 opacity-0"} overflow-hidden whitespace-nowrap transition-all`}>{t("more")}</span>
        </button>
        {moreOpen && (
          <div className="absolute bottom-full left-0 mb-3 w-64 rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl dark:border-gray-800 dark:bg-gray-950">
            <button
              onClick={() => {
                setMoreOpen(false);
                onSettings();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              <Settings className="h-5 w-5" />
              {t("settings")}
            </button>
            <button
              onClick={() => {
                onThemeToggle();
                setMoreOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              <MoonStar className="h-5 w-5" />
              {t("appearance")}
            </button>
            <button
              onClick={() => {
                setMoreOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-500 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              <LogOut className="h-5 w-5" />
              {t("logout")} {user?.username ? `@${user.username}` : ""}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
