import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ModelSelector } from './ModelSelector';
import { STYLE_PRESETS } from '@/lib/stylePresets';
import { PromptDraft } from '@/types';

const ASPECT_RATIOS = [
  { label: '1:1 正方形', value: '1:1', icon: '⏹️', w: 1024, h: 1024 },
  { label: '16:9 横屏', value: '16:9', icon: '🖥️', w: 1280, h: 720 },
  { label: '9:16 手机竖屏', value: '9:16', icon: '📱', w: 720, h: 1280 },
  { label: '4:3 经典小横屏', value: '4:3', icon: '🖼️', w: 1024, h: 768 },
  { label: '3:4 小竖屏', value: '3:4', icon: '📄', w: 768, h: 1024 },
];

export const Txt2ImgTab: React.FC = () => {
  const {
    currentPrompt,
    setCurrentPrompt,
    negativePrompt,
    setNegativePrompt,
    selectedModel,
    setSelectedModel,
    selectedStyle,
    setSelectedStyle,
    selectedLora,
    setSelectedLora,
    styleStrength,
    setStyleStrength,
    loraWeight,
    setLoraWeight,
    aspectRatio,
    setAspectRatio,
    steps,
    setSteps,
    guidance,
    setGuidance,
    batchCount,
    setBatchCount,
    generateImage,
    isGenerating,
    lastGeneratedImage,
    drafts,
    saveCurrentAsDraft,
    loadDraft,
    deleteDraft,
    settings,
    updateSettings,
    showToast,
  } = useApp();

  const [isTranslating, setIsTranslating] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (!isGenerating && currentPrompt.trim()) {
          e.preventDefault();
          handleGenerate();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPrompt, isGenerating]);

  const handleGenerate = () => {
    setUpscaledUrl(null);
    generateImage('text-to-image');
  };

  const handleTranslatePrompt = async () => {
    if (!currentPrompt.trim()) {
      showToast('请先输入提示词', 'info');
      return;
    }
    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentPrompt,
          targetLang: 'en',
          cfApiToken: settings.cfApiToken,
          cfAccountId: settings.cfAccountId,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.translatedText) {
        setCurrentPrompt(json.data.translatedText);
        showToast('已成功一键智能翻译！', 'success');
      } else {
        showToast(json.error || '翻译未完成', 'error');
      }
    } catch (e: any) {
      showToast('网络开小差了，请重试', 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleEnhanceWithLLM = async () => {
    if (!currentPrompt.trim()) {
      showToast('请先输入正向提示词', 'info');
      return;
    }
    setIsEnhancingPrompt(true);
    try {
      const res = await fetch('/api/translate/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Please turn this simple image prompt into a highly detailed 8k cinematic AI art prompt: "${currentPrompt}"`,
          targetLang: 'en',
          cfApiToken: settings.cfApiToken,
          cfAccountId: settings.cfAccountId,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.translatedText) {
        setCurrentPrompt(json.data.translatedText);
        showToast('五维画质润色完成！', 'success');
      }
    } catch (e) {
      showToast('润色处理失败', 'error');
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  const handleUpscaleImage = async (urlToUpscale: string) => {
    setIsUpscaling(true);
    try {
      const res = await fetch('/api/upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: urlToUpscale,
          factor: 2,
          cfApiToken: settings.cfApiToken,
          cfAccountId: settings.cfAccountId,
          stabilityApiKey: settings.stabilityApiKey,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.imageUrl) {
        setUpscaledUrl(json.data.imageUrl);
        showToast(json.data.message || '画质已高清放大！', 'success');
      } else {
        showToast(json.error || '超分处理失败', 'error');
      }
    } catch (e: any) {
      showToast('超分服务暂时不可用', 'error');
    } finally {
      setIsUpscaling(false);
    }
  };

  const handleRandomizeBestSpecs = () => {
    setSteps(Math.floor(Math.random() * 11) + 20);
    setGuidance(Number((Math.random() * 3 + 7).toFixed(1)));
    setStyleStrength(Number((Math.random() * 0.3 + 0.55).toFixed(2)));
    showToast('已随机抽取一组大师级画质参数！', 'info');
  };

  const activeDisplayImage = upscaledUrl || lastGeneratedImage?.imageUrl;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Engine Spec Banner */}
      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-slate-800/80 dark:to-slate-800/80 p-4 rounded-2xl border border-blue-100 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md">
            AI
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">当前画风与预设模型</div>
            <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
              {selectedModel?.name || 'FLUX.1 极速旗舰版 (推荐首选)'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ModelSelector />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column Controls */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>正向提示词 (Prompt)</span>
                <span className="text-[10px] font-normal text-slate-400">
                  {currentPrompt.length} 字
                </span>
              </label>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPrompt('')}
                  className="px-2 py-1 text-[11px] text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition"
                >
                  🗑️ 清空
                </button>
                <button
                  onClick={handleTranslatePrompt}
                  disabled={isTranslating}
                  className="px-2 py-1 text-[11px] font-medium bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-300 hover:bg-blue-100 rounded-lg transition flex items-center gap-1"
                >
                  {isTranslating ? '⏳ 翻译中...' : '🌐 中英互译'}
                </button>
                <button
                  onClick={handleEnhanceWithLLM}
                  disabled={isEnhancingPrompt}
                  className="px-2 py-1 text-[11px] font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm transition flex items-center gap-1"
                >
                  {isEnhancingPrompt ? '✨ 润色中...' : '✨ 五维润色'}
                </button>
              </div>
            </div>

            <textarea
              rows={3}
              value={currentPrompt}
              onChange={(e) => setCurrentPrompt(e.target.value)}
              placeholder="描述你想生成的画面细节... (支持中英文，按 Cmd/Ctrl + Enter 快捷生图)"
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
            />
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
            <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>🎨 丰富艺术风格预设</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                已选中: {selectedStyle?.name || '无滤镜'}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {STYLE_PRESETS.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`p-2 rounded-xl text-xs font-medium border text-left flex items-center gap-1.5 transition ${
                    selectedStyle.id === style.id
                      ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-sm">{style.icon}</span>
                  <span className="truncate text-[11px]">{style.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                ⚙️ 核心三大画质调节棒
              </span>
              <button
                onClick={handleRandomizeBestSpecs}
                className="text-[11px] px-2.5 py-1 bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-300 hover:bg-blue-100 rounded-lg transition font-bold"
              >
                🎲 随机大师参数
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  <span>风格强度</span>
                  <span className="text-blue-600">{styleStrength}</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={styleStrength}
                  onChange={(e) => setStyleStrength(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  <span>采样步数</span>
                  <span className="text-blue-600">{steps} 步</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  step={1}
                  value={steps}
                  onChange={(e) => setSteps(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  <span>引导系数 CFG</span>
                  <span className="text-blue-600">{guidance}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={0.5}
                  value={guidance}
                  onChange={(e) => setGuidance(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
            <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
              📐 画布比例与批量生成
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.value}
                  onClick={() => setAspectRatio(ratio.value)}
                  className={`p-2.5 rounded-xl text-xs font-bold border text-center transition flex flex-col items-center justify-center gap-1 ${
                    aspectRatio === ratio.value
                      ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-base">{ratio.icon}</span>
                  <span className="text-[11px]">{ratio.label}</span>
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                ⚡ 单次并行生成张数:
              </span>
              <div className="flex items-center gap-2">
                {[1, 2, 4].map((count) => (
                  <button
                    key={count}
                    onClick={() => setBatchCount(count)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                      batchCount === count
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900'
                    }`}
                  >
                    {count} 张
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !currentPrompt.trim()}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-base rounded-2xl shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <span>⏳ AI 正在全速推理生成中...</span>
            ) : (
              <span>🚀 立即生成画面 (Cmd/Ctrl + Enter)</span>
            )}
          </button>
        </div>

        {/* Right Output Display */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-sm min-h-[420px] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                🖼️ 实时绘图工作台预览
              </span>
              {activeDisplayImage && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpscaleImage(activeDisplayImage)}
                    disabled={isUpscaling}
                    className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900 rounded-lg text-xs font-bold hover:bg-amber-100 transition"
                  >
                    {isUpscaling ? '⚡ 超分中...' : '🔍 画质超分 2X'}
                  </button>
                  <a
                    href={activeDisplayImage}
                    download={`foxai3_${Date.now()}.png`}
                    className="px-2.5 py-1 bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-300 rounded-lg text-xs font-bold hover:bg-blue-100 transition"
                  >
                    💾 下载
                  </a>
                </div>
              )}
            </div>

            <div className="my-auto py-4 flex flex-col items-center justify-center">
              {isGenerating ? (
                <div className="space-y-4 text-center py-12">
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 animate-pulse">
                    正在由融合引擎并行推演...
                  </p>
                </div>
              ) : activeDisplayImage ? (
                <div className="space-y-3 w-full">
                  <div className="relative group rounded-xl overflow-hidden bg-slate-950 shadow-lg border border-slate-200/50 dark:border-slate-700">
                    <img
                      src={activeDisplayImage}
                      alt="Generated AI result"
                      className="w-full h-auto object-contain max-h-[500px] mx-auto transition transform duration-300 group-hover:scale-[1.01]"
                    />
                  </div>
                  {lastGeneratedImage?.params && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <div>
                        <span className="font-bold">Prompt:</span> {lastGeneratedImage.params.prompt}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                        <span>模型: {lastGeneratedImage.modelName}</span>
                        <span>耗时: {lastGeneratedImage.generationTimeMs || 1200} ms</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-slate-700 text-blue-500 dark:text-blue-400 flex items-center justify-center text-2xl mx-auto shadow-inner">
                    🎨
                  </div>
                  <div className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    画布等待生成
                  </div>
                  <div className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                    在左侧输入正向提示词，点击「立即生成画面」开启 AI 艺术之旅
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
