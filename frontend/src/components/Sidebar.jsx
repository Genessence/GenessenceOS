import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TableProperties, FileUp, ShieldAlert, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { user } = useAuth();

  const links = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Project Data', path: '/projects', icon: TableProperties },
    { name: 'Documents Upload', path: '/documents', icon: FileUp }
  ];

  const activeClass = 'flex items-center space-x-3 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 px-4 py-3.5 rounded-xl font-semibold shadow-xs transition-all duration-200 border-l-4 border-blue-600';
  const inactiveClass = 'flex items-center space-x-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 border-l-4 border-transparent';

  const renderNavLinks = () => (
    <nav className="space-y-1.5 px-3 py-6">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.path}
            to={link.path}
            onClick={() => setIsMobileOpen(false)}
            className={({ isActive }) => (isActive ? activeClass : inactiveClass)}
          >
            <Icon size={20} />
            <span className="flex-1">{link.name}</span>
            <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        );
      })}

      {user?.role === 'admin' && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-800 px-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 block mb-3">
            Administration
          </span>
          <NavLink
            to="/admin/users"
            onClick={() => setIsMobileOpen(false)}
            className={({ isActive }) => (isActive ? activeClass : inactiveClass)}
          >
            <ShieldAlert size={20} />
            <span>User Management</span>
          </NavLink>
        </div>
      )}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900 hidden md:flex flex-col shrink-0 min-h-[calc(100vh-64px)] transition-colors duration-200">
        <div className="flex-1 flex flex-col justify-between">
          {renderNavLinks()}
        </div>
        <div className="p-4 border-t border-gray-100 dark:border-slate-800 text-center text-xs text-gray-400 dark:text-slate-500">
          Genessence © 2026
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden backdrop-blur-xs"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Content */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 transform md:hidden flex flex-col justify-between ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-slate-800">
            <span className="text-lg font-bold text-gray-900 dark:text-white">Genessence Portal</span>
          </div>
          {renderNavLinks()}
        </div>
        <div className="p-4 border-t border-gray-100 dark:border-slate-800 text-center text-xs text-gray-400 dark:text-slate-500">
          Genessence © 2026
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
