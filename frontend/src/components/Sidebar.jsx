import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus2,
  TableProperties,
  FileBarChart,
  Settings,
  LogOut,
  Award,
  ChevronRight,
  X
} from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ isOpen = false, setIsOpen }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard',    path: '/dashboard' },
    { icon: FilePlus2,       label: 'Add Record',   path: '/dashboard/add' },
    { icon: TableProperties, label: 'View Records', path: '/dashboard/list' },
    { icon: FileBarChart,    label: 'Reports',      path: '/dashboard/reports' },
    { icon: Settings,        label: 'Settings',     path: '/dashboard/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const closeSidebar = () => {
    if (setIsOpen) setIsOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar - Always visible on lg+ */}
      <aside className="hidden lg:flex w-64 h-screen bg-slate-900 flex-col fixed left-0 top-0 z-50 shadow-2xl">
        <SidebarContent
          menuItems={menuItems}
          user={user}
          handleLogout={handleLogout}
          closeSidebar={closeSidebar}
          showCloseButton={false}
        />
      </aside>

      {/* Mobile Sidebar - Slide in overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="lg:hidden w-72 h-screen bg-slate-900 flex flex-col fixed left-0 top-0 z-50 shadow-2xl"
          >
            <SidebarContent
              menuItems={menuItems}
              user={user}
              handleLogout={handleLogout}
              closeSidebar={closeSidebar}
              showCloseButton={true}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

const SidebarContent = ({ menuItems, user, handleLogout, closeSidebar, showCloseButton }) => (
  <>
    {/* Logo */}
    <div className="px-6 py-6 sm:py-7 border-b border-slate-800 relative">
      {showCloseButton && (
        <button
          onClick={closeSidebar}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary-600 rounded-xl shadow-lg shadow-primary-900/50">
          <Award className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">Staff Module</h1>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Achievement Portal</p>
        </div>
      </div>
    </div>

    {/* Navigation */}
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-3">Main Menu</p>
      {menuItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/dashboard'}
          onClick={closeSidebar}
          className={({ isActive }) => `
            flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group text-sm font-medium
            ${isActive
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'}
          `}
        >
          <div className="flex items-center">
            <item.icon className="h-4 w-4 mr-3 flex-shrink-0" />
            <span>{item.label}</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 transition-transform" />
        </NavLink>
      ))}
    </nav>

    {/* User Profile & Logout */}
    <div className="p-4 border-t border-slate-800">
      <div className="flex items-center space-x-3 mb-3 px-1">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
          {user?.name?.charAt(0)?.toUpperCase() || 'S'}
        </div>
        <div className="overflow-hidden flex-1">
          <p className="text-sm font-semibold text-white truncate">{user?.name || 'Staff Member'}</p>
          <p className="text-[11px] text-slate-500 truncate">{user?.staffId || 'staff@portal'}</p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center py-2.5 px-3 text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-xl transition-all border border-slate-800 hover:border-red-900/50"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </button>
    </div>
  </>
);

export default Sidebar;