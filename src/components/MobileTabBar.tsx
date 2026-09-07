'use client';

import React from 'react';
import { Image as ImageIcon, Sparkles, Layers, History, Settings } from 'lucide-react';

export type TabType = 'txt2img' | 'img2img' | 'models' | 'history' | 'settings';

interface MobileTabBarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'txt2img' as TabType, label: '文生图', icon: Sparkles },
    { id: 'img2img' as TabType, label: '图生图', icon: ImageIcon },
    { id: 'models' as TabType, label: '模型库', icon: Layers },
    { id: 'history' as TabType, label: '历史记录', icon: History },
    { id: 'settings' as TabType, label: '设置', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-safe">
      <nav className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all duration-200 min-h-[48px] ${
                isActive
                  ? 'text-orange-500 dark:text-orange-400 font-semibold scale-105'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon size={20} className={isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'} />
              <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
