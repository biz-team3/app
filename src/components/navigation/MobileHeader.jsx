import { Bell } from "lucide-react";
import { Link } from "react-router-dom";

export function MobileHeader({ onNotifications, notificationBadgeCount = 0 }) {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-black md:hidden">
      <Link to="/" className="text-[25px]" style={{ fontFamily: "'Grand Hotel', cursive" }}>
        Instagram
      </Link>
      <div className="flex items-center gap-4">
        <button onClick={onNotifications} className="relative">
          <Bell className="h-6 w-6" />
          {notificationBadgeCount > 0 && (
            <span className="absolute -right-2 -top-2 rounded-full bg-[#ff3040] px-1.5 text-[10px] font-bold text-white">
              {notificationBadgeCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
