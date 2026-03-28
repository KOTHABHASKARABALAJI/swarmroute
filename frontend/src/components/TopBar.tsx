import { useState } from 'react';
import { Bell, LogOut, Zap, Search } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useNavigate } from 'react-router-dom';
import { NotificationsPanel } from './NotificationsPanel';

export const TopBar = () => {
  const { user, logout, unreadCount } = useStore();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const count = unreadCount();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="h-14 border-b border-border glass-panel flex items-center justify-between px-4 z-50 relative">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center cyber-glow">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-wider">
            <span className="text-primary cyber-glow-text">SWARM</span>
            <span className="text-foreground">ROUTE</span>
            <span className="text-muted-foreground text-xs ml-1 font-mono">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="bg-secondary/50 border border-border rounded-lg pl-9 pr-4 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 w-64"
              placeholder="Search shipments..."
            />
          </div>

          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-cyber-red rounded-full text-[10px] font-bold flex items-center justify-center text-foreground">
                {count}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="hidden md:inline font-mono text-xs">{user?.email}</span>
          </div>

          <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-secondary/50 transition-colors">
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
    </>
  );
};
