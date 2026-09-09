'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { ASPECT_RATIOS, SAMPLING_METHODS } from '@/lib/constants';
import { Upload, X, Wand2, Download, AlertCircle, Image as ImageIcon, Sliders } from 'lucide-react';
import { GeneratedImage } from '@/types';

interface Img2ImgTabProps {
  onOpenModelModal: () => void;
}

export const Img2ImgTab: React.FC<Img2ImgTabProps> = ({ onOpenModelModal }) => {
  const { selectedModel, settings, addHistoryItem, showToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [strength, setStrength] = useState(0.7);
  const [sampler, setSampler] = useState<string>(settings.defaultSampler || 'Euler a');
  const [aspectRatio, setAspectRatio] = useState(settings.defaultAspectRatio || '1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImg, setGeneratedImg] = useState<GeneratedImage | null>(null);
  const [errorText, setErrorText] = useState('');

  const currentRatioObj = ASPECT_RATIOS.find((r) => r.value === aspectRatio) || ASPECT_RATIOS[0];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('请上传格式正确的图片文件 (PNG, JPG, WEBP等)', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('图片文件不能超过 10MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setInputImage(event.target.result as string);
        showToast('参考图上传成功', 'success');
      }
    };
    reader.onerror = () => {
      showToast('图片读取失败，请重新选择', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setInputImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!inputImage) {
      showToast('请先上传一张参考图片', 'error');
      return;
    }

    if (!prompt.trim()) {
      showToast('请输入描述二次生成的提示词', 'error');
      return;
    }

    setIsGenerating(true);
    setErrorText('');

    try {
      const res = await fetch('/api/generate/image-to-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          negativePrompt: negativePrompt.trim(),
          inputImage,
          strength,
          width: currentRatioObj.width,
          height: currentRatioObj.height,
          aspectRatio,
          model: selectedModel.id,
          sampler,
          cfApiToken: settings.cfApiToken,
          cfAccountId: settings.cfAccountId,
        }),
      });

      const data = await res.json();

      if (data.success && data.data?.imageUrl) {
        const newItem: GeneratedImage = {
          id: `img2img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          imageUrl: data.data.imageUrl,
          params: {
            prompt,
            negativePrompt,
            inputImage,
            strength,
            width: currentRatioObj.width,
            height: currentRatioObj.height,
            aspectRatio,
            model: selectedModel.id,
            sampler,
          },
          createdAt: Date.now(),
          modelName: selectedModel.translatedName || selectedModel.name,
        };

        setGeneratedImg(newItem);
        await addHistoryItem(newItem);
        showToast('图生图生成成功！', 'success');
      } else {
        const msg = data.error || '图生图失败，请核对模型与 API Token 参数';
        setErrorText(msg);
        showToast(msg, 'error');
      }
    } catch (err: any) {
      const msg = err.message || '网络通讯异常，请稍后重试';
      setErrorText(msg);
      showToast(msg, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImg) return;
    const a = document.createElement('a');
    a.href = generatedImg.imageUrl;
    a.download = `fox-ai-img2img-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Active Model Selector Bar */}
      <div
        onClick={onOpenModelModal}
        className="flex items-center justify-between p-3.5 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-transparent border border-orange-200/50 dark:border-orange-800/40 rounded-xl cursor-pointer hover:border-orange-400 transition-all group"
      >
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
            图
          </div>
          <div className="truncate">
            <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">当前图生图模型</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {selectedModel.translatedName || selectedModel.name}
            </div>
          </div>
        </div>
        <span className="text-xs text-orange-500 dark:text-orange-400 font-medium group-hover:underline shrink-0 ml-2">
          切换模型 &rarr;
        </span>
      </div>

      {/* Main Form */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-4">
        {/* Upload Image Section */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
            <span>上传参考图</span>
            <span className="text-[10px] text-gray-400">支持拖拽或点击上传</span>
          </label>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          {!inputImage ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group bg-gray-50/50 dark:bg-gray-800/30"
            >
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Upload size={22} />
              </div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                点击或拖拽上传参考图片
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">支持 PNG, JPG, WEBP，最大 10MB</p>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-950 max-h-[220px] flex items-center justify-center group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inputImage}
                alt="参考图"
                className="max-h-[220px] w-auto object-contain rounded-xl"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                title="删除参考图"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Strength Slider */}
        <div>
          <div className="flex justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            <span className="flex items-center space-x-1">
              <Sliders size={14} className="text-orange-500" />
              <span>重绘强度 (Strength): {strength}</span>
            </span>
            <span className="text-[10px] text-gray-400">0.1 (接近原图) ~ 1.0 (大幅重构)</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={strength}
            onChange={(e) => setStrength(Number(e.target.value))}
            className="w-full accent-orange-500"
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
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all min-h-[40px]"
          >
            {SAMPLING_METHODS.map((method) => (
              <option key={method.id} value={method.id}>
                {method.name}
              </option>
            ))}
          </select>
        </div>

        {/* Prompt Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            二次生成提示词 (Prompt)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="描述基于该图片想改变的内容，例如：将其转换为动漫二次元风格，保留主体特征，背景加上绚丽星空..."
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
            placeholder="不希望出现的特征"
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all min-h-[40px]"
          />
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
              <span>白狐AI 图生图渲染中...</span>
            </>
          ) : (
            <>
              <Wand2 size={18} />
              <span>开始基于图片二次生成</span>
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {errorText && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl text-xs text-red-600 dark:text-red-400 flex items-start space-x-2.5">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
          <div>
            <div className="font-semibold text-sm mb-1">图生图异常提示</div>
            <p className="leading-relaxed">{errorText}</p>
          </div>
        </div>
      )}

      {/* Preview Area */}
      {generatedImg && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-1">
              <ImageIcon size={14} className="text-orange-500" />
              <span>图生图最新结果</span>
            </span>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-medium transition-colors"
            >
              <Download size={13} />
              <span>下载图片</span>
            </button>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-gray-950 flex items-center justify-center min-h-[250px] border border-gray-100 dark:border-gray-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={generatedImg.imageUrl}
              alt={generatedImg.params.prompt}
              className="w-full h-auto max-h-[500px] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
