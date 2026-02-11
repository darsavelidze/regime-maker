import { Outlet, NavLink } from 'react-router-dom'
import { Home, Search, PlusSquare, Calendar, Dumbbell, User } from 'lucide-react'

export default function Layout() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-center">
          <span className="text-2xl font-black tracking-tight">IN</span>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-md mx-auto">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="max-w-md mx-auto flex justify-around items-center h-16">
          <NavLink 
            to="/" 
            end 
            className={({ isActive }) => 
              `flex flex-col items-center gap-1 p-2 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <Home className="w-6 h-6" />
            <span className="text-xs">Лента</span>
          </NavLink>

          <NavLink 
            to="/explore" 
            className={({ isActive }) => 
              `flex flex-col items-center gap-1 p-2 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <Search className="w-6 h-6" />
            <span className="text-xs">Поиск</span>
          </NavLink>

          <NavLink 
            to="/create" 
            className={({ isActive }) => 
              `flex flex-col items-center gap-1 p-2 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <PlusSquare className="w-6 h-6" />
            <span className="text-xs">Создать</span>
          </NavLink>

          <NavLink 
            to="/day" 
            className={({ isActive }) => 
              `flex flex-col items-center gap-1 p-2 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <Calendar className="w-6 h-6" />
            <span className="text-xs">День</span>
          </NavLink>

          <NavLink 
            to="/workouts" 
            className={({ isActive }) => 
              `flex flex-col items-center gap-1 p-2 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <Dumbbell className="w-6 h-6" />
            <span className="text-xs">Трен.</span>
          </NavLink>

          <NavLink 
            to="/profile" 
            className={({ isActive }) => 
              `flex flex-col items-center gap-1 p-2 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Профиль</span>
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
