'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { AIModel } from '@/types';

interface ModelSelectorProps {
  isFullPage?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ isFullPage }) => {
  const {
    models,
    selectedModel,
    setSelectedModel,
    toggleFavoriteModel,
    showToast,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCustomModelModal, setShowCustomModelModal] = useState(false);
  const [customModelId, setCustomModelId] = useState('');
  const [customModelName, setCustomModelName] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const categories = [
    { id: 'all', name: '全部模型' },
    { id: 'favorites', name: '已收藏 ★' },
    { id: 'flux', name: 'FLUX 旗舰' },
    { id: 'sdxl', name: 'SDXL 系列' },
    { id: 'anime', name: '二次元 / 动漫' },
    { id: 'realistic', name: '写实摄影' },
    { id: 'sd15', name: 'SD 1.5 经典' },
    { id: '3d', name: '3D 与建模' },
  ];

  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      const matchesSearch =
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (model.translatedName && model.translatedName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        model.description.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'favorites') return model.isFavorite;
      return model.category === selectedCategory;
    });
  }, [models, searchTerm, selectedCategory]);

  const handleSelectModel = (model: AIModel) => {
    setSelectedModel(model);
    showToast(`已切换模型：${model.translatedName || model.name}`, 'success');
  };

  const handleTranslateAllModels = async () => {
    setIsTranslating(true);
    try {
      showToast('30+ 款预设模型均已预置高性能中文译名！', 'success');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleAddCustomModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customModelId.trim() || !customModelName.trim()) {
      showToast('请完整填写模型 ID 与显示名称', 'error');
      return;
    }

    const newModel: AIModel = {
      id: customModelId.trim(),
      name: customModelName.trim(),
      translatedName: customModelName.trim(),
      description: '用户自定义算力节点模型',
      provider: 'pollinations',
      category: 'flux',
    };

    setSelectedModel(newModel);
    setShowCustomModelModal(false);
    setCustomModelId('');
    setCustomModelName('');
    showToast(`已加载自定义模型：${newModel.name}`, 'success');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 搜索 30+ 预置模型名称、二次元、写实风格..."
            className="w-full pl-3 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTranslateAllModels}
            disabled={isTranslating}
            className="px-3 py-2 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition"
          >
            🌐 恢复中文译名
          </button>

          <button
            onClick={() => setShowCustomModelModal(true)}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
          >
            ➕ 自定义模型
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl font-bold shrink-0 border transition ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Model Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredModels.map((model) => {
          const isSelected = selectedModel.id === model.id;
          return (
            <div
              key={model.id}
              onClick={() => handleSelectModel(model)}
              className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-2 cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/20 border-blue-500 ring-2 ring-blue-500/30'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {model.translatedName || model.name}
                      </span>
                      {model.isPopular && (
                        <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded">
                          热门
                        </span>
                      )}
                    </div>
                    {model.translatedName && (
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[220px]">
                        {model.name}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavoriteModel(model.id);
                    }}
                    className={`p-1 text-base ${
                      model.isFavorite ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'
                    }`}
                  >
                    ★
                  </button>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {model.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                <span className="uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                  {model.provider}
                </span>

                {isSelected ? (
                  <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    ✓ 正在使用
                  </span>
                ) : (
                  <span className="text-blue-500 font-bold hover:underline">
                    点击启用 →
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Model Addition Modal */}
      {showCustomModelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                ➕ 录入自定义 AI 模型
              </h3>
              <button
                onClick={() => setShowCustomModelModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomModel} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  模型识别路径 / ID
                </label>
                <input
                  type="text"
                  required
                  value={customModelId}
                  onChange={(e) => setCustomModelId(e.target.value)}
                  placeholder="例如: black-forest-labs/FLUX.1-schnell"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  自定义显示名称
                </label>
                <input
                  type="text"
                  required
                  value={customModelName}
                  onChange={(e) => setCustomModelName(e.target.value)}
                  placeholder="例如: 我的 FLUX 专属大模型"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModelModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  添加并切换
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
