'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { AIModel } from '@/types';

interface CompactModelBarProps {
  onOpenFullModal?: () => void;
}

export const ModelSelector: React.FC<CompactModelBarProps> = ({ onOpenFullModal }) => {
  const { models, selectedModel, setSelectedModel, showToast } = useApp();
  const [showDrawer, setShowDrawer] = useState(false);

  const topModels = models.slice(0, 8);

  const handleSelect = (model: AIModel) => {
    setSelectedModel(model);
    showToast(`已选用: ${model.translatedName || model.name}`, 'success');
    setShowDrawer(false);
  };

  return (
    <div className="w-full">
      {/* Compact Quick Select Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
        <button
          onClick={() => setShowDrawer(true)}
          className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs whitespace-nowrap flex items-center gap-1 shadow-sm shrink-0"
        >
          <span>🎯 {selectedModel.translatedName || selectedModel.name}</span>
          <span className="text-[10px] opacity-80">▼</span>
        </button>

        {topModels.map((m) => (
          <button
            key={m.id}
            onClick={() => handleSelect(m)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition whitespace-nowrap shrink-0 ${
              selectedModel.id === m.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            {m.translatedName || m.name}
          </button>
        ))}
      </div>

      {/* Slide-Up Mobile Drawer Selector */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl max-h-[80vh] flex flex-col p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>🤖 切换 AI 绘图大模型</span>
                <span className="text-xs text-slate-400 font-normal">({models.length} 款预置)</span>
              </span>
              <button
                onClick={() => setShowDrawer(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {models.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleSelect(m)}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                    selectedModel.id === m.id
                      ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 font-extrabold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{m.translatedName || m.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                      {m.description}
                    </div>
                  </div>
                  {selectedModel.id === m.id && <span className="text-sm">✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
