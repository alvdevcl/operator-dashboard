import React from 'react';
import { Moon, Sun, User, LogOut } from 'lucide-react';
import { useThemeStore } from '../store/theme';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export function Header() {
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const navigate = useNavigate();

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menu = document.getElementById('profile-menu');
      const button = document.getElementById('profile-button');
      if (menu && button && !menu.contains(event.target as Node) && !button.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-end space-x-4 sm:space-x-0">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 w-9 hover:bg-muted"
          >
            {theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Toggle theme</span>
          </button>

          <div className="relative">
            <button
              id="profile-button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="inline-flex items-center justify-center rounded-full h-9 w-9 hover:bg-muted overflow-hidden"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#F15A5A] to-[#702459] flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0) || 'A'}
                </span>
              </div>
            </button>

            {showProfileMenu && (
              <div 
                id="profile-menu"
                className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-background ring-1 ring-black ring-opacity-5 animate-in fade-in slide-in-from-bottom-2"
              >
                <div className="py-2">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium">{user?.name || 'Admin User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email || 'admin@k8s.local'}</p>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm hover:bg-muted"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile Settings
                    </button>
                    <button
                      onClick={() => {
                        // Handle logout
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-muted"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}