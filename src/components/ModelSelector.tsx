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
  Plus,
  Compass,
  ThumbsUp,
  Cpu,
  BookmarkPlus,
  Loader2,
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
    showToast,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'preset' | 'online' | 'add'>('preset');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Online HuggingFace Model Search State
  const [onlineSearchQuery, setOnlineSearchQuery] = useState('flux');
  const [onlineSearchResults, setOnlineSearchResults] = useState<AIModel[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  // Saved Custom Models list in local state
  const [savedCustomModels, setSavedCustomModels] = useState<AIModel[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('fox_ai_saved_custom_models');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // New Custom Model Input State
  const [customName, setCustomName] = useState('');
  const [customPath, setCustomPath] = useState('');
  const [customProvider, setCustomProvider] = useState<'huggingface' | 'cloudflare' | 'pollinations' | 'custom'>('huggingface');
  const [customDesc, setCustomPathDesc] = useState('');

  const categories = [
    { id: 'all', label: '全部' },
    { id: 'popular', label: '热门精选' },
    { id: 'flux', label: 'FLUX 旗舰' },
    { id: 'sdxl', label: 'SDXL 核心' },
    { id: 'anime', label: '动漫二次元' },
    { id: 'realistic', label: '写实人像' },
    { id: '3d', label: '3D立体/盲盒' },
  ];

  // All combined models (preset + user saved custom models)
  const allModels = [...models, ...savedCustomModels];

  const handleSearchOnlineModels = async (q: string) => {
    if (!q.trim()) return;
    setIsSearchingOnline(true);
    try {
      const res = await fetch(`/api/models/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setOnlineSearchResults(data.data);
      }
    } catch {
      showToast('全网模型搜索失败，请稍后重试', 'error');
    } finally {
      setIsSearchingOnline(false);
    }
  };

  const saveModelToLibrary = (model: AIModel) => {
    const exists = savedCustomModels.some((m) => m.id === model.id);
    if (exists) {
      showToast('该模型已存在于您的模型库中', 'info');
      return;
    }
    const updated = [model, ...savedCustomModels];
    setSavedCustomModels(updated);
    try {
      localStorage.setItem('fox_ai_saved_custom_models', JSON.stringify(updated));
      showToast(`已成功将 ${model.name} 保存至您的模型库！`, 'success');
    } catch {
      showToast('保存模型失败', 'error');
    }
  };

  const filteredModels = allModels.filter((model) => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (model.translatedName &&
        model.translatedName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (showFavoritesOnly && !model.isFavorite) return false;
    if (selectedCategory === 'popular') return !!model.isPopular;
    if (selectedCategory !== 'all' && model.category !== selectedCategory) return false;

    return true;
  });

  const handleSelect = (model: AIModel) => {
    setSelectedModel(model);
    if (onSelectModel) onSelectModel(model);
    if (onCloseModal) onCloseModal();
  };

  const handleAddCustomModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customPath.trim()) return;

    const newModel: AIModel = {
      id: customPath.trim(),
      name: customName.trim(),
      translatedName: customName.trim(),
      description: customDesc.trim() || '自定义用户接入的外接 AI 模型',
      provider: customProvider,
      category: 'sdxl',
      isCustomAdded: true,
    };

    saveModelToLibrary(newModel);
    handleSelect(newModel);
  };

  const content = (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
        <div className="flex space-x-2 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('preset')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center space-x-1 ${
              activeSubTab === 'preset'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Layers size={14} />
            <span>我的模型库 ({allModels.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('online');
              if (onlineSearchResults.length === 0) {
                handleSearchOnlineModels(onlineSearchQuery);
              }
            }}
            className={`px-3 py-2 rounded-xl transition-all flex items-center space-x-1 ${
              activeSubTab === 'online'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Compass size={14} />
            <span>全网免费开源模型搜索</span>
          </button>

          <button
            onClick={() => setActiveSubTab('add')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center space-x-1 ${
              activeSubTab === 'add'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Plus size={14} />
            <span>接入外接模型</span>
          </button>
        </div>

        <button
          onClick={translateModels}
          disabled={isTranslating}
          className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 text-orange-600 dark:text-orange-400 rounded-lg text-xs font-medium hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors shrink-0 disabled:opacity-50"
        >
          <Languages size={15} />
          <span>{isTranslating ? '正在翻译...' : '一键中文'}</span>
        </button>
      </div>

      {/* SubTab 1: Built-in & Saved Custom Models */}
      {activeSubTab === 'preset' && (
        <div className="space-y-3">
          {/* Search & Filter Controls */}
          <div className="space-y-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索模型名称、关键词描述或路径..."
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
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

                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                      {model.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50 text-[10px]">
                    <span className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                      {model.provider === 'cloudflare' ? (
                        <>
                          <Cloud size={12} className="text-amber-500" />
                          <span>CF Workers AI</span>
                        </>
                      ) : model.provider === 'huggingface' ? (
                        <>
                          <Cpu size={12} className="text-purple-400" />
                          <span>HuggingFace</span>
                        </>
                      ) : (
                        <>
                          <Globe size={12} className="text-blue-400" />
                          <span>公共算力</span>
                        </>
                      )}
                    </span>

                    {model.isPopular && (
                      <span className="flex items-center space-x-0.5 text-orange-500 font-medium">
                        <Sparkles size={10} />
                        <span>热门推荐</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SubTab 2: Online Free Open-Source Search */}
      {activeSubTab === 'online' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={onlineSearchQuery}
                onChange={(e) => setOnlineSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchOnlineModels(onlineSearchQuery)}
                placeholder="搜索全网 HuggingFace 免 Key 开源模型 (如: flux, anime, realvis, SDXL)..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[40px]"
              />
            </div>
            <button
              onClick={() => handleSearchOnlineModels(onlineSearchQuery)}
              disabled={isSearchingOnline}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold shrink-0 flex items-center space-x-1"
            >
              {isSearchingOnline ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              <span>搜索开源库</span>
            </button>
          </div>

          {isSearchingOnline ? (
            <div className="p-8 text-center text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center space-x-2">
              <Loader2 size={16} className="animate-spin text-orange-500" />
              <span>正在搜索全网 HuggingFace 热门开源模型...</span>
            </div>
          ) : onlineSearchResults.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">请输入关键词搜索全网开放开源模型节点</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[48vh] overflow-y-auto pr-1">
              {onlineSearchResults.map((model) => (
                <div
                  key={model.id}
                  className="p-3.5 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl flex flex-col justify-between group shadow-sm hover:border-orange-400 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-gray-900 dark:text-white truncate">
                        {model.translatedName}
                      </span>
                      <span className="text-[9px] px-2 py-0.5 bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 rounded-full font-semibold">
                        HuggingFace
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {model.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleSelect(model)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg text-[11px] font-medium transition-colors"
                    >
                      直接调用
                    </button>
                    <button
                      type="button"
                      onClick={() => saveModelToLibrary(model)}
                      className="flex items-center space-x-1 px-2.5 py-1 bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 rounded-lg text-[11px] font-semibold hover:bg-orange-100 transition-colors"
                    >
                      <BookmarkPlus size={13} />
                      <span>保存至模型库</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SubTab 3: Add Custom Model */}
      {activeSubTab === 'add' && (
        <form onSubmit={handleAddCustomModel} className="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center space-x-1.5">
            <Plus size={16} className="text-orange-500" />
            <span>接入任意外接开源 / 私有 AI 模型</span>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">
              模型显示名称
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="例如: 我的私有SDXL模型 / Custom Flux"
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[38px]"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">
              模型 ID / HuggingFace 模型路径 / CF 路径
            </label>
            <input
              type="text"
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              placeholder="例如: black-forest-labs/FLUX.1-schnell 或 @cf/..."
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[38px]"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">
              算力提供商类型
            </label>
            <select
              value={customProvider}
              onChange={(e) => setCustomProvider(e.target.value as any)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[38px]"
            >
              <option value="huggingface">HuggingFace Inference API</option>
              <option value="cloudflare">Cloudflare Workers AI (@cf/)</option>
              <option value="pollinations">Pollinations 免费算力池</option>
              <option value="custom">自定义 WebUI / ComfyUI / API Endpoint</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">
              简短描述 (可选)
            </label>
            <input
              type="text"
              value={customDesc}
              onChange={(e) => setCustomPathDesc(e.target.value)}
              placeholder="对此模型的简要风格介绍"
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[38px]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm min-h-[42px]"
          >
            保存并立即选中此模型
          </button>
        </form>
      )}
    </div>
  );

  if (isOpenModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-2xl p-5 shadow-2xl relative max-h-[85vh] overflow-y-auto">
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
