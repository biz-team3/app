import { Home, PlusSquare, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function BottomNav({ onCreate }) {
  const location = useLocation();
  const items = [
    { icon: Home, path: "/" },
    { icon: PlusSquare, action: onCreate },
    { icon: User, path: "/profile" },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-black md:hidden">
      {items.map((item, index) => {
        const Icon = item.icon;
        const active = location.pathname === item.path || (item.path === "/profile" && location.pathname.startsWith("/profile"));
        return item.path ? (
          <Link key={`${item.path}-${index}`} to={item.path} className={active ? "text-black dark:text-white" : "text-gray-400"}>
            <Icon className="h-6 w-6" />
          </Link>
        ) : (
          <button key={`action-${index}`} onClick={item.action} className="text-gray-400">
            <Icon className="h-6 w-6" />
          </button>
        );
      })}
    </nav>
  );
}
