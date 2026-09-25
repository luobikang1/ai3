'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ASPECT_RATIOS, SAMPLING_METHODS, COMPUTE_ENGINES, enhancePromptText } from '@/lib/constants';
import { STYLE_PRESETS } from '@/lib/stylePresets';
import { LORA_PRESETS } from '@/lib/loraPresets';
import { Sparkles, Sliders, ChevronDown, Wand2, Download, AlertCircle, Cpu, Layers, Copy, Image as ImageIcon, Maximize2, Zap, Key } from 'lucide-react';
import { GeneratedImage } from '@/types';

interface Txt2ImgTabProps {
  onOpenModelModal: () => void;
  onSwitchToImg2ImgWithRef?: (imageUrl: string) => void;
  onOpenSettings?: () => void;
}

export const Txt2ImgTab: React.FC<Txt2ImgTabProps> = ({ onOpenModelModal, onSwitchToImg2ImgWithRef, onOpenSettings }) => {
  const { selectedModel, settings, updateSettings, addHistoryItem, showToast } = useApp();

  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>('none');
  const [selectedLora, setSelectedLora] = useState<string>('none');
  const [loraWeight, setLoraWeight] = useState<number>(0.8);
  const [sampler, setSampler] = useState<string>(settings.defaultSampler || 'Euler a');
  const [aspectRatio, setAspectRatio] = useState(settings.defaultAspectRatio || '1:1');
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [customWidth, setCustomWidth] = useState(1024);
  const [customHeight, setCustomHeight] = useState(1024);
  const [batchCount, setBatchCount] = useState<number>(settings.defaultBatchCount || 1);
  const [steps, setSteps] = useState(settings.defaultSteps || 25);
  const [guidance, setGuidance] = useState(settings.defaultGuidance || 7.5);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [twoStageUpscale, setTwoStageUpscale] = useState(false);
  const [generatedImg, setGeneratedImg] = useState<GeneratedImage | null>(null);
  const [errorText, setErrorText] = useState('');

  const currentRatioObj = ASPECT_RATIOS.find((r) => r.value === aspectRatio) || ASPECT_RATIOS[0];
  const finalWidth = isCustomSize ? customWidth : currentRatioObj.width;
  const finalHeight = isCustomSize ? customHeight : currentRatioObj.height;

  const handleEnhancePrompt = () => {
    if (!prompt.trim()) {
      showToast('请先输入生成提示词', 'info');
      return;
    }
    const enhanced = enhancePromptText(prompt);
    setPrompt(enhanced);
    showToast('已自动补全大师级品质关键词！', 'success');
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast('请输入作画提示词', 'error');
      return;
    }

    setIsGenerating(true);
    setErrorText('');

    let finalPrompt = prompt.trim();
    let finalNegative = negativePrompt.trim();

    if (selectedStyle !== 'none') {
      const styleObj = STYLE_PRESETS.find((s) => s.id === selectedStyle);
      if (styleObj) {
        finalPrompt += styleObj.promptSuffix;
        if (styleObj.negativePromptSuffix) {
          finalNegative += styleObj.negativePromptSuffix;
        }
      }
    }

    if (selectedLora !== 'none') {
      const loraObj = LORA_PRESETS.find((l) => l.id === selectedLora);
      if (loraObj) {
        finalPrompt += `, ${loraObj.triggerWord}`;
      }
    }

    try {
      const res = await fetch('/api/generate/text-to-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          negativePrompt: finalNegative,
          width: finalWidth,
          height: finalHeight,
          aspectRatio: isCustomSize ? `${finalWidth}x${finalHeight}` : aspectRatio,
          model: selectedModel.id,
          provider: selectedModel.provider,
          sampler,
          steps,
          guidance,
          seed: 424242,
          batchCount,
          computeEngine: settings.computeEngine || 'pollinations',
          sdApiEndpoint: settings.sdApiEndpoint,
          sdApiKey: settings.sdApiKey,
          cfApiToken: settings.cfApiToken,
          cfAccountId: settings.cfAccountId,
          hfApiKey: settings.hfApiKey,
          falApiKey: settings.falApiKey,
          openaiApiKey: settings.openaiApiKey,
          customEndpoint: settings.customEndpoint,
          enhancePrompt: true,
        }),
      });

      const data = await res.json();

      if (data.success && (data.data?.imageUrl || (data.data?.imageUrls && data.data.imageUrls.length > 0))) {
        let primaryUrl = data.data.imageUrl || data.data.imageUrls[0];
        let allUrls = data.data.imageUrls || [primaryUrl];

        if (twoStageUpscale) {
          try {
            showToast('阶段二：正在进行 AI 超分放大处理...', 'info');
            const editRes = await fetch('/api/generate/edit-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'upscale',
                inputImage: primaryUrl,
                scale: 2,
              }),
            });
            const editJson = await editRes.json();
            if (editJson.success && editJson.data?.imageUrl) {
              primaryUrl = editJson.data.imageUrl;
              allUrls[0] = primaryUrl;
            }
          } catch (e) {
            console.warn('Super resolution upscale step failed, returning initial sketch', e);
          }
        }

        const newItem: GeneratedImage = {
          id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          imageUrl: primaryUrl,
          imageUrls: allUrls,
          params: {
            prompt: finalPrompt,
            negativePrompt: finalNegative,
            width: twoStageUpscale ? finalWidth * 2 : finalWidth,
            height: twoStageUpscale ? finalHeight * 2 : finalHeight,
            aspectRatio: isCustomSize ? `${finalWidth}x${finalHeight}` : aspectRatio,
            model: selectedModel.id,
            sampler,
            steps,
            guidance,
            batchCount,
            computeEngineId: settings.computeEngine || 'pollinations',
            stylePreset: selectedStyle,
          },
          createdAt: Date.now(),
          modelName: selectedModel.translatedName || selectedModel.name,
        };

        setGeneratedImg(newItem);
        await addHistoryItem(newItem);
        showToast(`成功生成 ${allUrls.length} 张高清作画！`, 'success');
      } else {
        const msg = data.error || '图像生成失败，请核对接口配置或稍后重试';
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

  const handleCopyPrompt = () => {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt);
    showToast('提示词已复制到剪贴板！', 'success');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* High Quality Unlock Banner */}
      {!settings.hfApiKey && !settings.falApiKey && !settings.cfApiToken && (
        <div className="p-3 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-sky-500/5 dark:from-blue-950/40 dark:to-transparent border border-blue-200/60 dark:border-blue-800/50 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-200">
            <Key size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span>免费模式生效中！在“设置”中填入自有 HuggingFace 或 Fal Key 可解锁极速 4K 出图</span>
          </div>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg shrink-0 ml-2 shadow-sm transition-colors"
            >
              配置 Key &rarr;
            </button>
          )}
        </div>
      )}

      {/* Active Model & Engine Selector Bar */}
      <div className="p-3.5 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-sky-500/5 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-transparent border border-blue-200/50 dark:border-blue-800/40 rounded-xl transition-all space-y-2">
        <div
          onClick={onOpenModelModal}
          className="flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              AI
            </div>
            <div className="truncate">
              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider">
                当前画风与预设模型
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {selectedModel.translatedName || selectedModel.name}
              </div>
            </div>
          </div>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium group-hover:underline shrink-0 ml-2">
            选择模型 &rarr;
          </span>
        </div>

        {/* Quick Compute Engine Selector */}
        <div className="flex items-center space-x-2 pt-2 border-t border-blue-200/30 dark:border-blue-800/30">
          <Cpu size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 shrink-0">
            基础算力节点:
          </span>
          <select
            value={settings.computeEngine || 'pollinations'}
            onChange={(e) => updateSettings({ computeEngine: e.target.value })}
            className="flex-1 px-2.5 py-1 bg-white dark:bg-gray-900 border border-blue-300/60 dark:border-blue-800/60 rounded-lg text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {COMPUTE_ENGINES.map((eng) => (
              <option key={eng.id} value={eng.type}>
                {eng.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-4">
        {/* Prompt Input with Enhance & Copy Buttons */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              正向提示词 (Prompt)
            </label>
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="flex items-center space-x-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded text-[10px] hover:bg-gray-200 transition-colors"
                title="复制当前提示词"
              >
                <Copy size={11} />
                <span>复制</span>
              </button>
              <button
                type="button"
                onClick={handleEnhancePrompt}
                className="flex items-center space-x-1 px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 rounded-lg text-[11px] font-medium hover:bg-blue-100 transition-colors"
              >
                <Sparkles size={12} />
                <span>✨ 提示词魔改/优化</span>
              </button>
            </div>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="描述你想生成的画面细节，例如：一只身穿精美赛博朋克装甲的白狐，夜幕下的霓虹城市，超清细致，电影级打光..."
            className="w-full p-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition-all"
          />
        </div>

        {/* Style Presets Pills */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            艺术风格预设
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setSelectedStyle('none')}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 border transition-all ${
                selectedStyle === 'none'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
              }`}
            >
              无滤镜 (原汁原味)
            </button>
            {STYLE_PRESETS.map((preset) => {
              const isSelected = selectedStyle === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedStyle(preset.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium shrink-0 border transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* LoRA Style Fine-tuning Options */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-1">
              <Zap size={14} className="text-blue-500" />
              <span>LoRA 微调模型微小风格注入</span>
            </label>
            {selectedLora !== 'none' && (
              <span className="text-[10px] text-blue-600 font-bold">
                权重: {loraWeight}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setSelectedLora('none')}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 border transition-all ${
                selectedLora === 'none'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
              }`}
            >
              无 LoRA
            </button>
            {LORA_PRESETS.map((lora) => {
              const isSelected = selectedLora === lora.id;
              return (
                <button
                  key={lora.id}
                  type="button"
                  onClick={() => setSelectedLora(lora.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium shrink-0 border transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  ⚡ {lora.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Two-Stage Workflow Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
          <div>
            <div className="font-semibold text-gray-800 dark:text-gray-200">两段式出图流程 (草图生成 &rarr; 超分放大)</div>
            <div className="text-[10px] text-gray-400">初版画作生成后自动调用 2x AI 细节二次增强放大</div>
          </div>
          <input
            type="checkbox"
            checked={twoStageUpscale}
            onChange={(e) => setTwoStageUpscale(e.target.checked)}
            className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
          />
        </div>

        {/* Sampling Method Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            选择采样方法 (Sampler)
          </label>
          <select
            value={sampler}
            onChange={(e) => setSampler(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all min-h-[40px]"
          >
            {SAMPLING_METHODS.map((method) => (
              <option key={method.id} value={method.id}>
                {method.name}
              </option>
            ))}
          </select>
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
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all min-h-[40px]"
          />
        </div>

        {/* Aspect Ratio & Custom Dimensions Option */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                画面尺寸与比例
              </label>
              <button
                type="button"
                onClick={() => setIsCustomSize(!isCustomSize)}
                className={`flex items-center space-x-1 text-[11px] font-medium px-2 py-0.5 rounded-lg border transition-colors ${
                  isCustomSize
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                <Maximize2 size={12} />
                <span>{isCustomSize ? '使用常用比例' : '自定义长宽尺寸'}</span>
              </button>
            </div>

            {!isCustomSize ? (
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
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-bold text-[11px]">{item.value}</span>
                      <span className="text-[9px] opacity-80 scale-90">{item.label.split(' ')[1] || ''}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <span>自定义宽度: {customWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min="256"
                      max="2048"
                      step="64"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <span>自定义高度: {customHeight}px</span>
                    </div>
                    <input
                      type="range"
                      min="256"
                      max="2048"
                      step="64"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              单次并发生成张数
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setBatchCount(num)}
                  className={`py-2 text-xs font-bold rounded-xl border flex items-center justify-center space-x-1 transition-all ${
                    batchCount === num
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
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
                  className="w-full accent-blue-600"
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
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md active:scale-[0.99] disabled:opacity-50 min-h-[48px] flex items-center justify-center space-x-2"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>白狐AI 正在构思渲染 {batchCount} 张画作...</span>
            </>
          ) : (
            <>
              <Wand2 size={18} />
              <span>开始生成 {batchCount} 张画作</span>
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
              <Sparkles size={14} className="text-blue-600 dark:text-blue-400" />
              <span>最新生成结果 ({generatedImg.imageUrls?.length || 1} 张)</span>
            </span>
          </div>

          <div
            className={`grid gap-3 ${
              (generatedImg.imageUrls?.length || 1) > 1
                ? 'grid-cols-1 md:grid-cols-2'
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
                <div className="absolute bottom-2 right-2 flex space-x-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                  {onSwitchToImg2ImgWithRef && (
                    <button
                      onClick={() => onSwitchToImg2ImgWithRef(imgUrl)}
                      className="px-2.5 py-1.5 bg-black/70 hover:bg-blue-600 text-white rounded-lg text-xs font-medium backdrop-blur-sm transition-colors flex items-center space-x-1 shadow-md"
                      title="将此图作为图生图参考图"
                    >
                      <ImageIcon size={13} />
                      <span>以此重绘</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(imgUrl)}
                    className="p-1.5 bg-black/70 hover:bg-blue-600 text-white rounded-lg backdrop-blur-sm transition-colors shadow-md"
                    title="下载原图"
                  >
                    <Download size={14} />
                  </button>
                </div>
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
              <span>采样: {generatedImg.params.sampler || 'Euler a'}</span>
              <span>分辨率: {generatedImg.params.width} x {generatedImg.params.height}</span>
              <span>比例: {generatedImg.params.aspectRatio}</span>
              <span>步数: {generatedImg.params.steps}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
