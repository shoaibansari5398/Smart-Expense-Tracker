import React from 'react';
import { User } from '../types';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const activePath = location.pathname;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )},
    { path: '/calendar', label: 'Calendar', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )},
    { path: '/add', label: 'Add', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    )},
    { path: '/history', label: 'History', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
  ] as const;

  const isActive = (path: string) => {
    if (path === '/' && activePath === '/') return true;
    if (path !== '/' && activePath.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#020617] text-slate-100 selection:bg-emerald-500/30">
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex bg-slate-900/40 backdrop-blur-xl border-r border-slate-800 w-72 flex-shrink-0 flex-col justify-between p-6 sticky top-0 h-screen">
        <div>
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 font-bold text-lg shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/20">SE</div>
            <span className="text-xl font-bold text-slate-100 tracking-tight">Smart Expense</span>
          </div>

          <div className="flex flex-col gap-2">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-3 whitespace-nowrap ${
                  isActive(item.path)
                    ? 'bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* User Profile Section (Desktop) */}
        {user && (
          <div className="pt-6 border-t border-slate-800 mt-4">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-9 h-9 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-sm ring-2 ring-[#020617]">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors flex items-center gap-2 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto mb-20 md:mb-0 h-auto min-h-screen">
        <div className="max-w-7xl mx-auto">
           {/* Mobile Header */}
           <div className="md:hidden flex justify-between items-center mb-6 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 font-bold text-sm ring-1 ring-emerald-500/20">SE</div>
                <span className="font-bold text-slate-100 text-lg">Smart Expense</span>
              </div>
              {user && (
                <button
                  onClick={onLogout}
                  className="text-xs text-red-400 font-medium bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20"
                >
                  Sign Out
                </button>
              )}
           </div>

          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#020617]/80 backdrop-blur-xl border-t border-slate-800 px-6 py-2 pb-safe z-50 flex justify-between items-center">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 relative ${
              isActive(item.path)
                ? 'text-emerald-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
             {isActive(item.path) && (
               <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-emerald-500 rounded-b-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
             )}
             {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: "h-6 w-6" })}
            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Layout;
