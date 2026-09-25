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
  const [searchQuery, setSearchQuery] = useState('');
  const [showFreeInternetSearch, setShowFreeInternetSearch] = useState(false);
  const [internetFreeModels, setInternetFreeModels] = useState<AIModel[]>([]);
  const [isSearchingInternet, setIsSearchingInternet] = useState(false);

  const topModels = models.slice(0, 8);

  const handleSelect = (model: AIModel) => {
    setSelectedModel(model);
    showToast(`已选用: ${model.translatedName || model.name}`, 'success');
    setShowDrawer(false);
  };

  const handleSearchInternetFreeModels = async () => {
    if (!searchQuery.trim()) {
      showToast('请输入模型关键词，例如: flux, anime, sdxl, portrait', 'info');
      return;
    }
    setIsSearchingInternet(true);
    try {
      const res = await fetch(`/api/models/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const json = await res.json();
      const modelResults = Array.isArray(json.data) ? json.data : json.data?.models;
      if (json.success && Array.isArray(modelResults)) {
        setInternetFreeModels(modelResults);
        if (modelResults.length === 0) {
          showToast('全网搜索未匹配到相关开放模型', 'info');
        } else {
          showToast(`已匹配 ${modelResults.length} 款开放模型`, 'success');
        }
      } else {
        showToast('全网模型检索网络异常', 'error');
      }
    } catch {
      showToast('无法连接全网开源模型检索服务', 'error');
    } finally {
      setIsSearchingInternet(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
        <button
          onClick={() => setShowDrawer(true)}
          className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs whitespace-nowrap flex items-center gap-1.5 shadow-sm shrink-0"
        >
          <span>🎯 {selectedModel.translatedName || selectedModel.name}</span>
          {selectedModel.isFree ? (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500 text-white font-bold">
              免费
            </span>
          ) : (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500 text-white font-bold">
              需Key
            </span>
          )}
          <span className="text-[10px] opacity-80">▼</span>
        </button>

        {topModels.map((m) => (
          <button
            key={m.id}
            onClick={() => handleSelect(m)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition whitespace-nowrap shrink-0 flex items-center gap-1 ${
              selectedModel.id === m.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <span>{m.translatedName || m.name}</span>
            {m.isFree ? (
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold">
                [免Key]
              </span>
            ) : (
              <span className="text-[9px] text-slate-400 font-medium">
                [配Key]
              </span>
            )}
          </button>
        ))}
      </div>

      {showDrawer && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl max-h-[85vh] flex flex-col p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🤖 AI 绘图 30+ 预置大模型全库</span>
                </span>
                <span className="text-[11px] text-slate-400">默认展示 30 款模型，标注「免费免 Key」与「需配置 Key」</span>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setShowFreeInternetSearch(!showFreeInternetSearch)}
                className="text-xs font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1"
              >
                <span>🌐 {showFreeInternetSearch ? '折叠全网免费模型搜索' : '🔎 搜索互联网各类免费开源模型'}</span>
              </button>
            </div>

            {showFreeInternetSearch && (
              <div className="p-3 bg-blue-50/60 dark:bg-slate-950 rounded-2xl space-y-2 border border-blue-100 dark:border-slate-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="输入全网开源模型关键词 (如 flux, anime, sdxl, portrait)..."
                    className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  />
                  <button
                    onClick={handleSearchInternetFreeModels}
                    disabled={isSearchingInternet}
                    className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold whitespace-nowrap"
                  >
                    {isSearchingInternet ? '检索中...' : '搜索'}
                  </button>
                </div>

                {internetFreeModels.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                    {internetFreeModels.map((freeM) => (
                      <div
                        key={freeM.id}
                        onClick={() => handleSelect(freeM)}
                        className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs cursor-pointer hover:border-blue-500"
                      >
                        <div className="truncate mr-2">
                          <div className="font-bold truncate">{freeM.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{freeM.id}</div>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded shrink-0">
                          免费一键应用
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
                    <div className="text-xs font-bold flex items-center gap-2">
                      <span>{m.translatedName || m.name}</span>
                      {m.isFree ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold">
                          免费免 Key
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300 text-[10px] font-bold">
                          需配 Key
                        </span>
                      )}
                    </div>
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
