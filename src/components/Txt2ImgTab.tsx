import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ModelSelector } from './ModelSelector';
import { STYLE_PRESETS } from '@/lib/stylePresets';
import { SAMPLING_METHODS, SCHEDULER_TYPES } from '@/lib/constants';

const QUICK_ASPECT_RATIOS = [
  { label: '1:1 正方形', value: '1:1', icon: '⏹️', w: 1024, h: 1024 },
  { label: '16:9 横屏', value: '16:9', icon: '🖥️', w: 1216, h: 832 },
  { label: '9:16 手机屏', value: '9:16', icon: '📱', w: 832, h: 1216 },
  { label: '4:3 经典屏', value: '4:3', icon: '🖼️', w: 1152, h: 864 },
  { label: '3:4 竖屏', value: '3:4', icon: '📄', w: 864, h: 1152 },
];

export const Txt2ImgTab: React.FC = () => {
  const {
    currentPrompt,
    setCurrentPrompt,
    negativePrompt,
    setNegativePrompt,
    selectedModel,
    selectedStyle,
    setSelectedStyle,
    styleStrength,
    setStyleStrength,
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
    showToast,
  } = useApp();

  const [customWidth, setCustomWidth] = useState(1024);
  const [customHeight, setCustomHeight] = useState(1024);
  const [useCustomDimensions, setUseCustomDimensions] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [isGeneratingNegativeSuggest, setIsGeneratingNegativeSuggest] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null);
  const [selectedBatchIndex, setSelectedBatchIndex] = useState(0);

  // Drafts Modal Drawer State
  const [showDraftsDrawer, setShowDraftsDrawer] = useState(false);

  // Advanced Generator Tuning Panel States
  const [showAdvancedTuning, setShowAdvancedTuning] = useState(false);
  const [sampler, setSampler] = useState('Euler a');
  const [scheduler, setScheduler] = useState('Karras');
  const [clipSkip, setClipSkip] = useState(1);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [isSeedLocked, setIsSeedLocked] = useState(false);

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
    const finalSeed = isSeedLocked && seed ? seed : Math.floor(Math.random() * 899999) + 100000;
    if (!isSeedLocked) setSeed(finalSeed);

    generateImage('text-to-image', {
      customWidth: useCustomDimensions ? customWidth : undefined,
      customHeight: useCustomDimensions ? customHeight : undefined,
      sampler,
      scheduler,
      clipSkip,
      seed: finalSeed,
    });
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
          targetLang: 'mutual',
          cfApiToken: settings.cfApiToken,
          cfAccountId: settings.cfAccountId,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.translatedText) {
        setCurrentPrompt(json.data.translatedText);
        const direction = json.data.targetLang === 'zh' ? '英文 ➔ 中文' : '中文 ➔ 英文';
        showToast(`已成功一键 (${direction}) 转换！`, 'success');
      } else {
        showToast(json.error || '翻译未完成', 'error');
      }
    } catch {
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
          text: currentPrompt,
          targetLang: 'en',
          cfApiToken: settings.cfApiToken,
          cfAccountId: settings.cfAccountId,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.translatedText) {
        setCurrentPrompt(json.data.translatedText);
        showToast('五维画质扩写润色完成！', 'success');
      }
    } catch {
      showToast('润色处理失败', 'error');
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  // Generate Smart Negative Prompt Suggestion
  const handleSuggestNegativePrompt = async () => {
    setIsGeneratingNegativeSuggest(true);
    try {
      const suggestions = 'low resolution, blurry, distorted, extra limbs, bad hands, bad face, deformed, ugly, mutated fingers, watermark, text, out of frame';
      setNegativePrompt(suggestions);
      showToast('已一键智能补充通用最佳避坑负向提示词！', 'success');
    } finally {
      setIsGeneratingNegativeSuggest(false);
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
    } catch {
      showToast('超分服务暂时不可用', 'error');
    } finally {
      setIsUpscaling(false);
    }
  };

  const activeDisplayImage = upscaledUrl || lastGeneratedImage?.imageUrl;

  return (
    <div className="space-y-4 pb-20">
      {/* Compact Model Selector Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <ModelSelector />
      </div>

      <div className="space-y-4">
        {/* 1. Positive Prompt Input Box */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>正向提示词 (Prompt)</span>
              <span className="text-[10px] font-normal text-slate-400">
                {currentPrompt.length} 字
              </span>
            </label>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => saveCurrentAsDraft()}
                className="px-2 py-1 text-[11px] font-bold bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 transition"
                title="存草稿"
              >
                💾 存草稿
              </button>
              <button
                onClick={() => setShowDraftsDrawer(true)}
                className="px-2 py-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition"
                title="草稿箱"
              >
                📁 草稿箱 ({drafts.length})
              </button>
              <button
                onClick={handleTranslatePrompt}
                disabled={isTranslating}
                className="px-2 py-1 text-[11px] font-bold bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-300 hover:bg-blue-100 rounded-lg transition"
              >
                {isTranslating ? '⏳' : '🌐 中英互译'}
              </button>
              <button
                onClick={handleEnhanceWithLLM}
                disabled={isEnhancingPrompt}
                className="px-2 py-1 text-[11px] font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm transition"
              >
                {isEnhancingPrompt ? '✨' : '✨ 5维扩写'}
              </button>
            </div>
          </div>

          <textarea
            rows={3}
            value={currentPrompt}
            onChange={(e) => setCurrentPrompt(e.target.value)}
            placeholder="描述你想生成的画面细节... (按 Cmd/Ctrl + Enter 快捷生图)"
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
          />
        </div>

        {/* 2. Negative Prompt Input Box directly below positive prompt */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>🚫 反向提示词 (Negative Prompt)</span>
            </label>

            <button
              onClick={handleSuggestNegativePrompt}
              disabled={isGeneratingNegativeSuggest}
              className="px-2.5 py-1 text-[11px] font-extrabold bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-300 hover:bg-blue-100 rounded-lg transition border border-blue-200 dark:border-slate-700"
            >
              ✨ 一键生成优化建议
            </button>
          </div>

          <textarea
            rows={2}
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="需要过滤或排除的画面属性，如: blurry, deformed, low quality..."
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
          />
        </div>

        {/* Batch Count Selector Group */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <span>⚡ 一次并行生成张数 (最多 4 张):</span>
          </span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => setBatchCount(count)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition ${
                  batchCount === count
                    ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {count} 张
              </button>
            ))}
          </div>
        </div>

        {/* 3. Real-time Workstation Preview Output Display directly below prompt input area */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm min-h-[380px] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span>🖼️ 实时绘图工作台预览区 (直接位于提示词下方)</span>
              {lastGeneratedImage?.imageUrls && lastGeneratedImage.imageUrls.length > 1 && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-extrabold">
                  矩阵生图: {lastGeneratedImage.imageUrls.length} 张
                </span>
              )}
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
                  className="px-2.5 py-1 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-300 rounded-lg text-xs font-bold hover:bg-blue-100 transition"
                >
                  💾 下载
                </a>
              </div>
            )}
          </div>

          <div className="my-auto py-4 flex flex-col items-center justify-center">
            {isGenerating ? (
              <div className="space-y-4 text-center py-12">
                <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500 animate-pulse">
                  正在由融合算力引擎并行推演生成 {batchCount} 张画作...
                </p>
              </div>
            ) : lastGeneratedImage?.imageUrls && lastGeneratedImage.imageUrls.length > 1 ? (
              <div className="space-y-4 w-full">
                {/* Active Main Display Image */}
                <div className="relative group rounded-xl overflow-hidden bg-slate-950 shadow-lg border border-slate-200 dark:border-slate-800">
                  <img
                    src={lastGeneratedImage.imageUrls[selectedBatchIndex] || activeDisplayImage}
                    alt="Generated AI result"
                    className="w-full h-auto object-contain max-h-[460px] mx-auto"
                  />
                </div>

                {/* 2x2 Batch Grid Gallery */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  {lastGeneratedImage.imageUrls.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedBatchIndex(idx)}
                      className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition ${
                        selectedBatchIndex === idx
                          ? 'border-blue-600 ring-2 ring-blue-500 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Batch ${idx + 1}`} className="w-full h-24 object-cover" />
                      <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeDisplayImage ? (
              <div className="space-y-3 w-full">
                <div className="relative group rounded-xl overflow-hidden bg-slate-950 shadow-lg border border-slate-200 dark:border-slate-800">
                  <img
                    src={activeDisplayImage}
                    alt="Generated AI result"
                    className="w-full h-auto object-contain max-h-[520px] mx-auto"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-16 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-500 flex items-center justify-center text-2xl mx-auto">
                  🎨
                </div>
                <div className="text-xs font-black text-slate-700 dark:text-slate-300">
                  工作台等待生成画作
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Aspect Ratios & Dimensions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
              📐 图像尺寸与画幅调节
            </span>
            <button
              onClick={() => setUseCustomDimensions(!useCustomDimensions)}
              className="text-[11px] px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold"
            >
              {useCustomDimensions ? '切换预设比例' : '⚙️ 自定义像素 (W×H)'}
            </button>
          </div>

          {useCustomDimensions ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-3 border border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <span>宽度 (Width):</span>
                    <span className="text-blue-600">{customWidth} px</span>
                  </div>
                  <input
                    type="range"
                    min={512}
                    max={1536}
                    step={64}
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <span>高度 (Height):</span>
                    <span className="text-blue-600">{customHeight} px</span>
                  </div>
                  <input
                    type="range"
                    min={512}
                    max={1536}
                    step={64}
                    value={customHeight}
                    onChange={(e) => setCustomHeight(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {QUICK_ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.value}
                  onClick={() => {
                    setAspectRatio(ratio.value);
                    setCustomWidth(ratio.w);
                    setCustomHeight(ratio.h);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold border text-center transition flex flex-col items-center justify-center gap-1 ${
                    aspectRatio === ratio.value && !useCustomDimensions
                      ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span className="text-sm">{ratio.icon}</span>
                  <span className="text-[11px]">{ratio.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 5. Style Presets */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
          <div className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center justify-between">
            <span>🎨 艺术风格预设</span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
              {selectedStyle?.name || '无滤镜'}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {STYLE_PRESETS.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style)}
                className={`p-2 rounded-xl text-xs font-bold border text-left flex items-center gap-1.5 transition ${
                  selectedStyle.id === style.id
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <span className="text-sm">{style.icon}</span>
                <span className="truncate text-[11px]">{style.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 6. Generator Tuning Accordion */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <button
            onClick={() => setShowAdvancedTuning(!showAdvancedTuning)}
            className="w-full flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-200"
          >
            <span className="flex items-center gap-2">
              <span>🎛️ 高级生成器调优面板 (应有尽有)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                极客模组
              </span>
            </span>
            <span>{showAdvancedTuning ? '▲ 折叠' : '▼ 展开调优'}</span>
          </button>

          {showAdvancedTuning && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-fade-in text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    采样算法 (Sampler)
                  </label>
                  <select
                    value={sampler}
                    onChange={(e) => setSampler(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
                  >
                    {SAMPLING_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    调度算法 (Scheduler)
                  </label>
                  <select
                    value={scheduler}
                    onChange={(e) => setScheduler(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
                  >
                    {SCHEDULER_TYPES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>采样步数:</span>
                    <span className="text-blue-600">{steps} 步</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={50}
                    value={steps}
                    onChange={(e) => setSteps(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>引导系数 CFG:</span>
                    <span className="text-blue-600">{guidance}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    step={0.5}
                    value={guidance}
                    onChange={(e) => setGuidance(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>CLIP Skip:</span>
                    <span className="text-blue-600">{clipSkip}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={4}
                    value={clipSkip}
                    onChange={(e) => setClipSkip(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="font-bold whitespace-nowrap">🎲 随机种子 (Seed):</span>
                  <input
                    type="number"
                    placeholder="随机生成"
                    value={seed || ''}
                    onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : undefined)}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-xs w-32"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setSeed(Math.floor(Math.random() * 899999) + 100000)}
                    className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 rounded-lg font-bold hover:bg-slate-300"
                  >
                    🎲 换 Seed
                  </button>
                  <label className="flex items-center gap-1 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSeedLocked}
                      onChange={(e) => setIsSeedLocked(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>锁定 Seed</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 7. Trigger Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !currentPrompt.trim()}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-base rounded-2xl shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-[0.99] flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <span>⏳ AI 正在全速推演生成中...</span>
          ) : (
            <span>🚀 立即生成画面 (Cmd/Ctrl + Enter)</span>
          )}
        </button>
      </div>

      {/* Slide-Up Drafts Drawer */}
      {showDraftsDrawer && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl max-h-[75vh] flex flex-col p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>📁 提示词草稿箱 ({drafts.length})</span>
              </span>
              <button
                onClick={() => setShowDraftsDrawer(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {drafts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <div>📁 暂无草稿</div>
                <div>点击正向提示词框旁的「存草稿」按钮即可快捷保存当前提示词与全部参数组合</div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {drafts.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 truncate">
                      <div className="font-bold truncate text-slate-800 dark:text-slate-200">{d.title}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{d.prompt}</div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          loadDraft(d);
                          setShowDraftsDrawer(false);
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                      >
                        载入
                      </button>
                      <button
                        onClick={() => deleteDraft(d.id)}
                        className="px-2.5 py-1.5 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
