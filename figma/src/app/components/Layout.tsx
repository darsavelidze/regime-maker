import { Outlet, useLocation, Link } from "react-router";
import { Home, Search, Plus, Calendar, Dumbbell, User } from "lucide-react";

export function Layout() {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Лента" },
    { path: "/search", icon: Search, label: "Поиск" },
    { path: "/create", icon: Plus, label: "Создать" },
    { path: "/calendar", icon: Calendar, label: "День" },
    { path: "/workouts", icon: Dumbbell, label: "Трен." },
    { path: "/profile", icon: User, label: "Профиль" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-center">IN</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-2xl mx-auto px-2">
          <div className="flex justify-around">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center py-3 px-4 min-w-0 flex-1"
                >
                  <Icon
                    className={`w-6 h-6 mb-1 ${
                      isActive ? "text-black" : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-xs ${
                      isActive ? "text-black font-medium" : "text-gray-400"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
