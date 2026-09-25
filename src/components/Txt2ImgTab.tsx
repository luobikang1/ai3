import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ModelSelector } from './ModelSelector';
import { STYLE_PRESETS } from '@/lib/stylePresets';
import { SAMPLING_METHODS, SCHEDULER_TYPES } from '@/lib/constants';

const QUICK_ASPECT_RATIOS = [
  { label: '1:1 正方形', value: '1:1', icon: '⏹️', w: 1024, h: 1024 },
  { label: '16:9 横屏', value: '16:9', icon: '🖥️', w: 1280, h: 720 },
  { label: '9:16 手机屏', value: '9:16', icon: '📱', w: 720, h: 1280 },
  { label: '4:3 经典屏', value: '4:3', icon: '🖼️', w: 1024, h: 768 },
  { label: '3:4 竖屏', value: '3:4', icon: '📄', w: 768, h: 1024 },
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
    settings,
    showToast,
  } = useApp();

  const [customWidth, setCustomWidth] = useState(1024);
  const [customHeight, setCustomHeight] = useState(1024);
  const [useCustomDimensions, setUseCustomDimensions] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null);

  // Advanced Generator Tuning Panel States ("应有尽有")
  const [showAdvancedTuning, setShowAdvancedTuning] = useState(false);
  const [sampler, setSampler] = useState('Euler a');
  const [scheduler, setScheduler] = useState('Karras');
  const [clipSkip, setClipSkip] = useState(1);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [isSeedLocked, setIsSeedLocked] = useState(false);
  const [enableHiresFix, setEnableHiresFix] = useState(false);
  const [hiresScale, setHiresScale] = useState(1.5);
  const [hiresDenoising, setHiresDenoising] = useState(0.5);
  const [enableFaceRestore, setEnableFaceRestore] = useState(true);

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
      enableHiresFix,
      hiresScale,
      hiresDenoising,
      enableFaceRestore,
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

  const activeDisplayImage = upscaledUrl || lastGeneratedImage?.imageUrl;

  return (
    <div className="space-y-4 pb-20">
      {/* Compact Model Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <ModelSelector />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column Controls */}
        <div className="lg:col-span-7 space-y-4">
          {/* Positive Prompt Input Box */}
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
                  onClick={() => setCurrentPrompt('')}
                  className="px-2 py-1 text-[11px] text-slate-500 hover:text-rose-600 rounded-lg transition"
                >
                  🗑️ 清空
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
                  {isEnhancingPrompt ? '✨' : '✨ 智能润色'}
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

          {/* Style Presets */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
            <div className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>🎨 艺术风格预设</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                {selectedStyle?.name || '无滤镜'}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
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

          {/* Aspect Ratios & Dimensions */}
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

          {/* Comprehensive Generator Tuning Accordion ("应有尽有" 调优面板) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <button
              onClick={() => setShowAdvancedTuning(!showAdvancedTuning)}
              className="w-full flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-200"
            >
              <span className="flex items-center gap-2">
                <span>🎛️ 高级生成器调优面板 (应有尽有)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  专业极客
                </span>
              </span>
              <span>{showAdvancedTuning ? '▲ 折叠' : '▼ 展开高级调优'}</span>
            </button>

            {showAdvancedTuning && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-fade-in text-xs">
                {/* Sampler & Scheduler Selection */}
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

                {/* Steps, Guidance & CLIP Skip */}
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

                {/* Seed Control & Lock */}
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
                      🎲 随机换 Seed
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

                {/* High-Res Fix & Face Restore Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableHiresFix}
                          onChange={(e) => setEnableHiresFix(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span>高清修复 (Hires.fix)</span>
                      </label>
                      <span className="text-[10px] text-blue-600 font-bold">{hiresScale}X</span>
                    </div>
                    {enableHiresFix && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[10px]">
                          <span>重绘幅度:</span>
                          <span>{hiresDenoising}</span>
                        </div>
                        <input
                          type="range"
                          min={0.2}
                          max={0.8}
                          step={0.05}
                          value={hiresDenoising}
                          onChange={(e) => setHiresDenoising(Number(e.target.value))}
                          className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded accent-blue-600"
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-extrabold">👤 面部与细节微调强化</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        内置 CodeFormer 美颜与手部矫正
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableFaceRestore}
                      onChange={(e) => setEnableFaceRestore(e.target.checked)}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Trigger Generate Button */}
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

        {/* Right Output Display */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm min-h-[380px] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
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
                    正在由融合引擎并行推演...
                  </p>
                </div>
              ) : activeDisplayImage ? (
                <div className="space-y-3 w-full">
                  <div className="relative group rounded-xl overflow-hidden bg-slate-950 shadow-lg border border-slate-200 dark:border-slate-800">
                    <img
                      src={activeDisplayImage}
                      alt="Generated AI result"
                      className="w-full h-auto object-contain max-h-[480px] mx-auto"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-500 flex items-center justify-center text-2xl mx-auto">
                    🎨
                  </div>
                  <div className="text-xs font-black text-slate-700 dark:text-slate-300">
                    画布等待生成
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
