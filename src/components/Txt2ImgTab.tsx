'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ASPECT_RATIOS, enhancePromptText } from '@/lib/constants';
import { Sparkles, Sliders, ChevronDown, Wand2, Download, AlertCircle, Cpu, Layers, Copy } from 'lucide-react';
import { GeneratedImage } from '@/types';

interface Txt2ImgTabProps {
  onOpenModelModal: () => void;
}

export const Txt2ImgTab: React.FC<Txt2ImgTabProps> = ({ onOpenModelModal }) => {
  const { selectedModel, settings, addHistoryItem, showToast } = useApp();

  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState(settings.defaultAspectRatio || '1:1');
  const [batchCount, setBatchCount] = useState<number>(settings.defaultBatchCount || 1);
  const [steps, setSteps] = useState(settings.defaultSteps || 20);
  const [guidance, setGuidance] = useState(settings.defaultGuidance || 7.5);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImg, setGeneratedImg] = useState<GeneratedImage | null>(null);
  const [errorText, setErrorText] = useState('');

  const currentRatioObj = ASPECT_RATIOS.find((r) => r.value === aspectRatio) || ASPECT_RATIOS[0];

  const handleEnhancePrompt = () => {
    if (!prompt.trim()) {
      showToast('请先输入提示词', 'info');
      return;
    }
    const enhanced = enhancePromptText(prompt);
    setPrompt(enhanced);
    showToast('已完成提示词品质魔改与优化！', 'success');
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast('请输入提示词', 'error');
      return;
    }

    setIsGenerating(true);
    setErrorText('');

    try {
      const res = await fetch('/api/generate/text-to-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          negativePrompt: negativePrompt.trim(),
          width: currentRatioObj.width,
          height: currentRatioObj.height,
          aspectRatio,
          model: selectedModel.id,
          steps,
          guidance,
          batchCount,
          computeEngine: settings.computeEngine || 'stable-diffusion',
          sdApiEndpoint: settings.sdApiEndpoint,
          sdApiKey: settings.sdApiKey,
          cfApiToken: settings.cfApiToken,
          cfAccountId: settings.cfAccountId,
          hfApiKey: settings.hfApiKey,
          falApiKey: settings.falApiKey,
          openaiApiKey: settings.openaiApiKey,
          customEndpoint: settings.customEndpoint,
        }),
      });

      const data = await res.json();

      if (data.success && (data.data?.imageUrl || (data.data?.imageUrls && data.data.imageUrls.length > 0))) {
        const primaryUrl = data.data.imageUrl || data.data.imageUrls[0];
        const allUrls = data.data.imageUrls || [primaryUrl];

        const newItem: GeneratedImage = {
          id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          imageUrl: primaryUrl,
          imageUrls: allUrls,
          params: {
            prompt,
            negativePrompt,
            width: currentRatioObj.width,
            height: currentRatioObj.height,
            aspectRatio,
            model: selectedModel.id,
            steps,
            guidance,
            batchCount,
            computeEngineId: settings.computeEngine || 'stable-diffusion',
          },
          createdAt: Date.now(),
          modelName: selectedModel.translatedName || selectedModel.name,
        };

        setGeneratedImg(newItem);
        await addHistoryItem(newItem);
        showToast(`成功生成 ${allUrls.length} 张高质量图片！`, 'success');
      } else {
        const msg = data.error || '图像生成失败，外部算力未响应';
        setErrorText(msg);
        showToast(msg, 'error');
      }
    } catch (err: any) {
      const msg = err.message || '网络通信失败，请检查连通性';
      setErrorText(msg);
      showToast(msg, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (urlToDownload?: string) => {
    const targetUrl = urlToDownload || generatedImg?.imageUrl;
    if (!targetUrl) return;
    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = `fox-ai-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Active Model & Engine Selector Bar */}
      <div
        onClick={onOpenModelModal}
        className="flex items-center justify-between p-3.5 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-transparent border border-orange-200/50 dark:border-orange-800/40 rounded-xl cursor-pointer hover:border-orange-400 transition-all group"
      >
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
            AI
          </div>
          <div className="truncate">
            <div className="text-xs text-orange-600 dark:text-orange-400 font-medium flex items-center space-x-1">
              <Cpu size={12} />
              <span>
                引擎: {settings.computeEngine === 'cloudflare-ai' ? 'Cloudflare Workers AI' : settings.computeEngine === 'huggingface' ? 'HuggingFace 无限制' : 'Stable Diffusion 核心'}
              </span>
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {selectedModel.translatedName || selectedModel.name}
            </div>
          </div>
        </div>
        <span className="text-xs text-orange-500 dark:text-orange-400 font-medium group-hover:underline shrink-0 ml-2">
          切换模型/算力 &rarr;
        </span>
      </div>

      {/* Main Form */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-4">
        {/* Prompt Input with Enhance Button */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              正向提示词 (Prompt)
            </label>
            <button
              type="button"
              onClick={handleEnhancePrompt}
              className="flex items-center space-x-1 px-2.5 py-1 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/60 text-orange-600 dark:text-orange-400 rounded-lg text-[11px] font-medium hover:bg-orange-100 transition-colors"
            >
              <Sparkles size={12} />
              <span>提示词品质优化</span>
            </button>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="描述你想生成的画面细节，例如：一只身穿精美赛博朋克装甲的白狐，夜幕下的霓虹城市，超清细致，电影级打光..."
            className="w-full p-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none transition-all"
          />
        </div>

        {/* Negative Prompt */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            负向提示词 (Negative Prompt) <span className="text-gray-400 font-normal">(可选)</span>
          </label>
          <input
            type="text"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="不希望在画面中出现的元素，如：模糊、低画质、变形、多余的手指"
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all min-h-[40px]"
          />
        </div>

        {/* Aspect Ratio & Batch Count Option */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              画面尺寸与比例
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {ASPECT_RATIOS.map((item) => {
                const isSelected = aspectRatio === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setAspectRatio(item.value)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                        : 'bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-bold text-[11px]">{item.value}</span>
                    <span className="text-[9px] opacity-80 scale-90">{item.label.split(' ')[1] || ''}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              单次生成图片张数
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setBatchCount(num)}
                  className={`py-2 text-xs font-bold rounded-xl border flex items-center justify-center space-x-1 transition-all ${
                    batchCount === num
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Layers size={14} />
                  <span>生成 {num} 张</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Settings Accordion */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 py-1"
          >
            <span className="flex items-center space-x-1">
              <Sliders size={14} />
              <span>高级生成参数 (采样步数 / CFG Scale)</span>
            </span>
            <ChevronDown
              size={16}
              className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            />
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-3 pt-2 border-t border-dashed border-gray-200 dark:border-gray-800 animate-fade-in">
              <div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>采样步数 (Steps): {steps}</span>
                  <span className="text-[10px] text-gray-400">建议 20-30</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="50"
                  value={steps}
                  onChange={(e) => setSteps(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>引导系数 (CFG Scale): {guidance}</span>
                  <span className="text-[10px] text-gray-400">建议 7.0 - 9.0</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={guidance}
                  onChange={(e) => setGuidance(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-3.5 bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl text-sm transition-all shadow-md active:scale-[0.99] disabled:opacity-50 min-h-[48px] flex items-center justify-center space-x-2"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>白狐AI 正在渲染 {batchCount} 张画作中...</span>
            </>
          ) : (
            <>
              <Wand2 size={18} />
              <span>开始生成 {batchCount} 张图像</span>
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {errorText && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl text-xs text-red-600 dark:text-red-400 flex items-start space-x-2.5">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
          <div>
            <div className="font-semibold text-sm mb-1">生成出错提示</div>
            <p className="leading-relaxed">{errorText}</p>
          </div>
        </div>
      )}

      {/* Preview Area Grid */}
      {generatedImg && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-1">
              <Sparkles size={14} className="text-orange-500" />
              <span>最新生成结果 ({generatedImg.imageUrls?.length || 1} 张)</span>
            </span>
          </div>

          <div
            className={`grid gap-3 ${
              (generatedImg.imageUrls?.length || 1) > 1
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1'
            }`}
          >
            {(generatedImg.imageUrls || [generatedImg.imageUrl]).map((imgUrl, index) => (
              <div
                key={index}
                className="relative rounded-xl overflow-hidden bg-gray-950 border border-gray-100 dark:border-gray-800 group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgUrl}
                  alt={`${generatedImg.params.prompt} - ${index + 1}`}
                  className="w-full h-auto max-h-[450px] object-contain rounded-xl"
                />
                <button
                  onClick={() => handleDownload(imgUrl)}
                  className="absolute bottom-2 right-2 p-2 bg-black/70 hover:bg-orange-600 text-white rounded-lg text-xs font-medium backdrop-blur-sm transition-colors flex items-center space-x-1 shadow-md"
                >
                  <Download size={13} />
                  <span>下载</span>
                </button>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div>
              <span className="font-semibold text-gray-900 dark:text-gray-200">提示词: </span>
              {generatedImg.params.prompt}
            </div>
            <div className="text-[11px] text-gray-400 flex flex-wrap gap-2 pt-1">
              <span>模型: {generatedImg.modelName}</span>
              <span>比例: {generatedImg.params.aspectRatio}</span>
              <span>步数: {generatedImg.params.steps}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
