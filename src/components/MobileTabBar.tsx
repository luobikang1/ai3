import React from 'react';
import { useApp } from '@/context/AppContext';

export type TabType = 'txt2img' | 'ai' | 'models' | 'history' | 'settings';

interface MobileTabBarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ activeTab, setActiveTab }) => {
  const { layoutMode } = useApp();

  if (layoutMode === 'desktop') return null;

  const visibilityClass = layoutMode === 'mobile' ? 'flex' : 'flex md:hidden';
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'txt2img', label: '文生图', icon: '🎨' },
    { id: 'ai', label: 'AI 助手', icon: '🤖' },
    { id: 'models', label: '模型库', icon: '📚' },
    { id: 'history', label: '历史', icon: '📜' },
    { id: 'settings', label: '设置', icon: '⚙️' },
  ];

  return (
    <div className={`${visibilityClass} fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 px-2 py-1.5 items-center justify-around shadow-lg`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
              isActive
                ? 'text-blue-600 dark:text-blue-400 font-black scale-105'
                : 'text-slate-500 dark:text-slate-400 font-medium'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
