import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Settings,
  Menu,
  ChevronLeft,
  Library,
  Layers,
  BookOpen,
  User,
  Moon,
  Sun
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useThemeStore } from '../store/theme';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    href: '/',
  },
  {
    label: 'Software Catalogs',
    icon: <Library className="h-5 w-5" />,
    href: '/catalogs',
  },
  {
    label: 'Resources',
    icon: <Boxes className="h-5 w-5" />,
    href: '/resources',
  },
  {
    label: 'Environments',
    icon: <Layers className="h-5 w-5" />,
    href: '/environments',
  },
  {
    label: 'Documentation',
    icon: <BookOpen className="h-5 w-5" />,
    href: '/docs',
  },
  {
    label: 'Settings',
    icon: <Settings className="h-5 w-5" />,
    href: '/settings',
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  // Close mobile menu when route changes
  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleProfileClick = () => {
    navigate('/profile');
    setMobileOpen(false); // Close mobile menu when navigating to profile
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'w-20' : 'w-64'}
          bg-background border-r`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b">
            {!collapsed && (
              <span className="font-bold text-xl gradient-text">Prime EDM</span>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-md hover:bg-muted lg:block hidden"
            >
              <ChevronLeft className={`h-5 w-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-foreground hover:bg-muted group transition-colors
                      ${location.pathname === item.href ? 'bg-muted' : ''}`}
                  >
                    <span className="flex items-center justify-center">
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="ml-3 text-sm font-medium">{item.label}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Theme Toggle */}
          <div className="px-3 py-2">
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center px-3 py-2 rounded-md hover:bg-muted transition-colors`}
            >
              {theme === 'light' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              {!collapsed && (
                <span className="ml-3 text-sm font-medium">
                  {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                </span>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="p-4 border-t">
            <button
              onClick={handleProfileClick}
              className="w-full flex items-center gap-3 hover:bg-muted p-2 rounded-md transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#F15A5A] to-[#702459] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0) || 'A'}
                </span>
              </div>
              {!collapsed && (
                <div className="text-left overflow-hidden">
                  <p className="text-sm font-medium truncate">{user?.name || 'Admin User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || 'admin@k8s.local'}</p>
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}