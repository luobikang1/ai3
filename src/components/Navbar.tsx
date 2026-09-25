import React from 'react';
import { useApp } from '@/context/AppContext';

export type TabType = 'txt2img' | 'img2img' | 'models' | 'history' | 'settings';

interface NavbarProps {
  currentTab?: TabType;
  onTabChange?: (tab: TabType) => void;
  activeTab?: TabType;
  setActiveTab?: (tab: TabType) => void;
  onOpenSettings?: () => void;
  onOpenModelModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  activeTab: explicitActiveTab,
  setActiveTab: explicitSetActiveTab,
}) => {
  const { auth, logout, isDarkMode, toggleDarkMode } = useApp();

  const activeTab = explicitActiveTab || currentTab || 'txt2img';
  const handleTabClick = (tab: TabType) => {
    if (explicitSetActiveTab) explicitSetActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const navItems: { id: TabType; label: string; icon: string }[] = [
    { id: 'txt2img', label: '文生图', icon: '🎨' },
    { id: 'img2img', label: '图生图', icon: '🖼️' },
    { id: 'models', label: '模型库', icon: '📚' },
    { id: 'history', label: '历史', icon: '📜' },
    { id: 'settings', label: '设置', icon: '⚙️' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Title: Fixed as "白狐AI三" */}
        <div
          onClick={() => handleTabClick('txt2img')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20 group-hover:scale-105 transition transform">
            🦊
          </div>
          <span className="font-black text-lg tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
            白狐AI三
          </span>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                activeTab === item.id
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-base"
            title="切换深色/浅色模式"
          >
            {isDarkMode ? '🌙' : '☀️'}
          </button>

          {auth.isLoggedIn && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 hidden sm:inline-block">
                👤 {auth.username || '管理员'}
              </span>
              <button
                onClick={logout}
                className="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl transition"
              >
                退出
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
