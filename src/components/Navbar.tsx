'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Sun, Moon, User, LogOut, Lock } from 'lucide-react';

interface NavbarProps {
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuthModal }) => {
  const { settings, updateSettings, auth, logout } = useApp();

  const toggleDarkMode = () => {
    updateSettings({ darkMode: !settings.darkMode });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand Title - 固定显示为: 白狐AI三 */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            狐
          </div>
          <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">
            白狐AI三
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={settings.darkMode ? '切换浅色模式' : '切换深色模式'}
            aria-label="Toggle Theme"
          >
            {settings.darkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} />}
          </button>

          {/* Auth Button */}
          {auth.isLoggedIn ? (
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 dark:text-gray-200">
              <User size={14} className="text-orange-500" />
              <span className="max-w-[80px] truncate">{auth.username}</span>
              <button
                onClick={logout}
                className="text-gray-400 hover:text-red-500 ml-1 transition-colors"
                title="退出登录"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-xs font-medium shadow-sm transition-colors"
            >
              <Lock size={13} />
              <span>登录管理员</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
