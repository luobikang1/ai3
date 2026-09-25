'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { AIModel } from '@/types';
import { Search, Star, Languages, Plus, Check, Sparkles, X, Globe, Layers } from 'lucide-react';

interface ModelSelectorProps {
  isOpenModal?: boolean;
  onCloseModal?: () => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ isOpenModal, onCloseModal }) => {
  const {
    models,
    selectedModel,
    setSelectedModel,
    toggleFavoriteModel,
    translateModels,
    isTranslating,
    showToast,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showHfDiscovery, setShowHfDiscovery] = useState(false);
  const [hfSearchQuery, setHfSearchQuery] = useState('');
  const [hfResults, setHfResults] = useState<AIModel[]>([]);
  const [isSearchingHf, setIsSearchingHf] = useState(false);

  // Custom Model Form State
  const [showCustomModelModal, setShowCustomModelModal] = useState(false);
  const [customModelId, setCustomModelId] = useState('');
  const [customModelName, setCustomModelName] = useState('');
  const [customProvider, setCustomProvider] = useState<'cloudflare' | 'huggingface' | 'fal-ai' | 'pollinations' | 'stable-diffusion'>('pollinations');

  const categories = [
    { id: 'all', name: '全部模型' },
    { id: 'favorites', name: '已收藏 ★' },
    { id: 'flux', name: 'FLUX 旗舰' },
    { id: 'sdxl', name: 'SDXL 系列' },
    { id: 'anime', name: '二次元 / 动漫' },
    { id: 'realistic', name: '写实摄影' },
    { id: 'sd15', name: 'SD 1.5 经典' },
    { id: '3d', name: '3D 与盲盒' },
  ];

  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      // Search term matching
      const matchesSearch =
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (model.translatedName && model.translatedName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        model.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Category matching
      if (!matchesSearch) return false;
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'favorites') return model.isFavorite;
      return model.category === selectedCategory;
    });
  }, [models, searchTerm, selectedCategory]);

  const handleSelectModel = (model: AIModel) => {
    setSelectedModel(model);
    showToast(`已切换模型：${model.translatedName || model.name}`, 'success');
    if (onCloseModal) onCloseModal();
  };

  const handleSearchHfOnline = async () => {
    if (!hfSearchQuery.trim()) {
      showToast('请输入 HuggingFace 模型关键词', 'info');
      return;
    }

    setIsSearchingHf(true);
    try {
      const res = await fetch(`/api/models/search?q=${encodeURIComponent(hfSearchQuery.trim())}`);
      const data = await res.json();
      if (data.success && data.data?.models) {
        setHfResults(data.data.models);
        if (data.data.models.length === 0) {
          showToast('未找到相关的开源绘图模型', 'info');
        }
      } else {
        showToast('在线模型检索服务异常', 'error');
      }
    } catch {
      showToast('无法连接在线 HuggingFace 检索点', 'error');
    } finally {
      setIsSearchingHf(false);
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
      description: `用户自定义算力节点模型 (${customProvider})`,
      provider: customProvider,
      category: 'flux',
    };

    setSelectedModel(newModel);
    setShowCustomModelModal(false);
    setCustomModelId('');
    setCustomModelName('');
    showToast(`已加载自定义模型：${newModel.name}`, 'success');
    if (onCloseModal) onCloseModal();
  };

  const content = (
    <div className="space-y-4 pb-20">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索 30+ 预置模型名称、描述或二次元/写实风格..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={translateModels}
            disabled={isTranslating}
            className="flex items-center space-x-1 px-3 py-2 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors shrink-0"
          >
            <Languages size={14} />
            <span>{isTranslating ? '翻译中...' : '一键中文名'}</span>
          </button>

          <button
            onClick={() => setShowHfDiscovery(!showHfDiscovery)}
            className="flex items-center space-x-1 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors shrink-0"
          >
            <Globe size={14} />
            <span>探索开源模型</span>
          </button>

          <button
            onClick={() => setShowCustomModelModal(true)}
            className="flex items-center space-x-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold transition-colors shrink-0"
          >
            <Plus size={14} />
            <span>自定义</span>
          </button>
        </div>
      </div>

      {/* HuggingFace Discovery Online Drawer */}
      {showHfDiscovery && (
        <div className="p-4 bg-gradient-to-r from-indigo-50/80 to-blue-50/80 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center space-x-1">
              <Globe size={15} />
              <span>HuggingFace 开放社区在线绘图模型检索</span>
            </span>
            <button
              onClick={() => setShowHfDiscovery(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              value={hfSearchQuery}
              onChange={(e) => setHfSearchQuery(e.target.value)}
              placeholder="输入 HuggingFace 模型路径，如 stable-diffusion / flux / animagine"
              className="flex-1 px-3 py-1.5 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs"
            />
            <button
              onClick={handleSearchHfOnline}
              disabled={isSearchingHf}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              {isSearchingHf ? '检索中...' : '搜索'}
            </button>
          </div>

          {/* Results List */}
          {hfResults.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 max-h-[200px] overflow-y-auto">
              {hfResults.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleSelectModel(m)}
                  className="p-2.5 bg-white dark:bg-gray-900 border border-indigo-100 dark:border-indigo-900/50 rounded-xl hover:border-indigo-500 cursor-pointer flex items-center justify-between"
                >
                  <div className="truncate mr-2">
                    <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {m.name}
                    </div>
                    <div className="text-[10px] text-gray-400 truncate">{m.id}</div>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-bold shrink-0">
                    应用
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 border transition-all ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:border-gray-300'
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
              className={`relative p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-2 cursor-pointer group ${
                isSelected
                  ? 'bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/20 border-blue-500 ring-2 ring-blue-500/30'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700'
              }`}
              onClick={() => handleSelectModel(model)}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {model.translatedName || model.name}
                      </span>
                      {model.isPopular && (
                        <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded">
                          热门
                        </span>
                      )}
                    </div>
                    {model.translatedName && (
                      <div className="text-[10px] text-gray-400 font-mono truncate max-w-[200px]">
                        {model.name}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavoriteModel(model.id);
                    }}
                    className={`p-1.5 rounded-full transition-colors ${
                      model.isFavorite
                        ? 'text-amber-400 hover:text-amber-500'
                        : 'text-gray-300 hover:text-amber-400'
                    }`}
                  >
                    <Star size={16} fill={model.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                  {model.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400">
                <span className="uppercase font-semibold tracking-wider px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                  {model.provider}
                </span>

                {isSelected ? (
                  <span className="flex items-center space-x-1 font-bold text-blue-600 dark:text-blue-400">
                    <Check size={13} />
                    <span>正在使用</span>
                  </span>
                ) : (
                  <span className="opacity-0 group-hover:opacity-100 text-blue-500 font-medium transition-opacity">
                    点击启用 &rarr;
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Model Addition Modal */}
      {showCustomModelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center space-x-2">
                <Layers size={18} className="text-blue-600" />
                <span>录入自定义 AI 模型</span>
              </h3>
              <button
                onClick={() => setShowCustomModelModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCustomModel} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  归属算力平台 (Provider)
                </label>
                <select
                  value={customProvider}
                  onChange={(e: any) => setCustomProvider(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                >
                  <option value="pollinations">Pollinations 免费算力池</option>
                  <option value="cloudflare">Cloudflare Workers AI</option>
                  <option value="huggingface">HuggingFace Inference</option>
                  <option value="fal-ai">Fal.ai 高性能算力云</option>
                  <option value="stable-diffusion">SD WebUI 自定义节点</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  模型识别路径 / ID
                </label>
                <input
                  type="text"
                  required
                  value={customModelId}
                  onChange={(e) => setCustomModelId(e.target.value)}
                  placeholder="如: @cf/stabilityai/stable-diffusion-xl-base-1.0"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  自定义显示名称
                </label>
                <input
                  type="text"
                  required
                  value={customModelName}
                  onChange={(e) => setCustomModelName(e.target.value)}
                  placeholder="如: 我的 SD 极速专属节点"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModelModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
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

  // Render as fullscreen Modal or Inline Component
  if (isOpenModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in">
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0">
            <h2 className="font-bold text-base text-gray-900 dark:text-white flex items-center space-x-2">
              <Sparkles className="text-blue-600" size={18} />
              <span>白狐AI 预置算力模型全库</span>
            </h2>
            <button
              onClick={onCloseModal}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{content}</div>
        </div>
      </div>
    );
  }

  return content;
};
