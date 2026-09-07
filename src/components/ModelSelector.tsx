'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { AIModel } from '@/types';
import {
  Search,
  Star,
  Languages,
  Check,
  X,
  Sparkles,
  Layers,
  Cloud,
  Globe,
} from 'lucide-react';

interface ModelSelectorProps {
  isOpenModal?: boolean;
  onCloseModal?: () => void;
  onSelectModel?: (model: AIModel) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  isOpenModal = false,
  onCloseModal,
  onSelectModel,
}) => {
  const {
    models,
    selectedModel,
    setSelectedModel,
    toggleFavoriteModel,
    translateModels,
    isTranslating,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const categories = [
    { id: 'all', label: '全部' },
    { id: 'popular', label: '热门精选' },
    { id: 'sdxl', label: 'SDXL' },
    { id: 'flux', label: 'FLUX' },
    { id: 'anime', label: '动漫二次元' },
    { id: 'realistic', label: '写实人像' },
    { id: '3d', label: '3D立体/盲盒' },
  ];

  const filteredModels = models.filter((model) => {
    // Search query filter
    const matchesSearch =
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (model.translatedName &&
        model.translatedName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Favorites filter
    if (showFavoritesOnly && !model.isFavorite) return false;

    // Category filter
    if (selectedCategory === 'popular') return !!model.isPopular;
    if (selectedCategory !== 'all' && model.category !== selectedCategory) return false;

    return true;
  });

  const handleSelect = (model: AIModel) => {
    setSelectedModel(model);
    if (onSelectModel) onSelectModel(model);
    if (onCloseModal) onCloseModal();
  };

  const content = (
    <div className="space-y-4">
      {/* Header & Translation action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <Layers className="text-orange-500" size={18} />
            <span>绘图模型选择 ({filteredModels.length} / {models.length})</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            默认包含 30 条内置热点 AI 算法模型，支持一键切换与中文翻译
          </p>
        </div>

        <button
          onClick={translateModels}
          disabled={isTranslating}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 text-orange-600 dark:text-orange-400 rounded-lg text-xs font-medium hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors shrink-0 disabled:opacity-50 self-start sm:self-auto"
        >
          <Languages size={15} />
          <span>{isTranslating ? '正在翻译名称...' : '一键翻为中文'}</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索模型名称或关键字描述..."
            className="w-full pl-9 pr-8 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[40px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Category Tabs & Favorites Toggle */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors shrink-0 border ${
              showFavoritesOnly
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
            }`}
          >
            <Star size={13} className={showFavoritesOnly ? 'fill-current' : ''} />
            <span>收藏夹</span>
          </button>

          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id && !showFavoritesOnly;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setShowFavoritesOnly(false);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors shrink-0 border ${
                  isActive
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Models Grid */}
      {filteredModels.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">未找到符合条件的模型</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
          {filteredModels.map((model) => {
            const isSelected = selectedModel.id === model.id;
            const displayName = model.translatedName || model.name;

            return (
              <div
                key={model.id}
                onClick={() => handleSelect(model)}
                className={`p-3 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                  isSelected
                    ? 'bg-orange-50/80 dark:bg-orange-950/40 border-orange-500 dark:border-orange-500 shadow-sm'
                    : 'bg-white dark:bg-gray-800/60 border-gray-200 dark:border-gray-700/80 hover:border-orange-300 dark:hover:border-orange-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-xs text-gray-900 dark:text-white leading-tight flex items-center space-x-1.5">
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
                          <Check size={10} />
                        </span>
                      )}
                      <span className="truncate">{displayName}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteModel(model.id);
                      }}
                      className="text-gray-400 hover:text-amber-500 p-1 shrink-0"
                      title={model.isFavorite ? '取消收藏' : '收藏模型'}
                    >
                      <Star
                        size={15}
                        className={model.isFavorite ? 'text-amber-500 fill-amber-500' : ''}
                      />
                    </button>
                  </div>

                  {model.translatedName && model.translatedName !== model.name && (
                    <div className="text-[10px] text-gray-400 truncate mt-0.5">{model.name}</div>
                  )}

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                    {model.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50 text-[10px]">
                  <span className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                    {model.provider === 'cloudflare' ? (
                      <>
                        <Cloud size={12} className="text-amber-500" />
                        <span>Cloudflare Workers AI</span>
                      </>
                    ) : (
                      <>
                        <Globe size={12} className="text-blue-400" />
                        <span>公共/免费算力平台</span>
                      </>
                    )}
                  </span>

                  {model.isPopular && (
                    <span className="flex items-center space-x-0.5 text-orange-500 font-medium">
                      <Sparkles size={10} />
                      <span>热门</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  if (isOpenModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-2xl p-5 shadow-2xl relative">
          <button
            onClick={onCloseModal}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm pb-20">
      {content}
    </div>
  );
};
