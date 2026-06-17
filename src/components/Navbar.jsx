import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, LogOut, User, Shield } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin, isManager } = useAuth();
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );

  // Sync theme changes with DOM and localStorage
  const toggleDarkMode = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('color-scheme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('color-scheme', 'light');
    }
  };

  // Watch for system theme change events
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('color-scheme')) {
        setDarkMode(e.matches);
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      default:
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
    }
  };

  return (
    <header className="h-16 border-b border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900 sticky top-0 z-40 flex items-center justify-between px-6 transition-colors duration-200 shadow-xs">
      <div className="flex items-center space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold text-xl">
          G
        </div>
        <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white hidden sm:inline-block">
          Genessence Project Management Portal
        </span>
        <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white sm:hidden">
          Genessence Portal
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {/* Theme Toggler */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* User Card */}
        {user && (
          <div className="flex items-center space-x-3 pl-3 border-l border-gray-200 dark:border-slate-800">
            <div className="flex flex-col text-right hidden md:flex">
              <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                {user.name}
              </span>
              <span className={`text-2xs px-1.5 py-0.5 border rounded-full font-medium inline-self-end capitalize ${getRoleBadge(user.role)}`}>
                {user.role}
              </span>
            </div>
            
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 border border-gray-200 text-gray-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
              {user.role === 'admin' ? <Shield size={18} /> : <User size={18} />}
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
