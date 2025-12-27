import { Link, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, Upload, User, LogOut, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/upload', label: 'Upload', icon: Upload },
    { to: '/records', label: 'Records', icon: FileText },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">HealthTrack</span>
        </Link>

        {user && (
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link key={item.to} to={item.to}>
                  <Button 
                    variant={isActive ? "secondary" : "ghost"} 
                    size="sm"
                    className={cn(
                      "gap-2",
                      isActive && "bg-secondary text-secondary-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          ) : (
            <Link to="/auth">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {user && (
        <nav className="md:hidden flex items-center justify-around border-t border-border/40 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to}>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={cn(
                    "flex-col h-auto py-2 px-3 gap-1",
                    isActive && "text-primary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
