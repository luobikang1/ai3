import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { ASPECT_RATIOS } from '@/lib/constants';

export const Img2ImgTab: React.FC = () => {
  const {
    currentPrompt,
    setCurrentPrompt,
    negativePrompt,
    selectedModel,
    styleStrength,
    setStyleStrength,
    aspectRatio,
    setAspectRatio,
    steps,
    guidance,
    generateImage,
    isGenerating,
    lastGeneratedImage,
    showToast,
  } = useApp();

  const [inputImage, setInputImage] = useState<string | null>(null);
  const [imageStrength, setImageStrength] = useState(0.65);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('请选择正确的图片格式 (PNG/JPG/WEBP)', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('参考图不能超过 10MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setInputImage(event.target.result as string);
        showToast('参考图上传成功！', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setInputImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerateImg2Img = () => {
    if (!inputImage) {
      showToast('请先上传一张参考图片', 'error');
      return;
    }
    if (!currentPrompt.trim()) {
      showToast('请输入二次重绘的正向提示词', 'error');
      return;
    }

    generateImage('image-to-image', {
      inputImage,
      strength: imageStrength,
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
            🖼️ 图像生成图像 (Img2Img 垫图/重绘)
          </h2>
          <p className="text-blue-100 text-xs mt-1">
            上传参考图，控制重绘相似度，基于现有构图二次重构 AI 大作
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control Area */}
        <div className="lg:col-span-7 space-y-5">
          {/* Reference Image Upload Box */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                1. 上传垫图 / 参考图像
              </span>
              {inputImage && (
                <button
                  onClick={handleRemoveImage}
                  className="text-[11px] text-rose-500 hover:text-rose-600 font-bold"
                >
                  ✕ 移除当前参考图
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />

            {inputImage ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-64 bg-slate-950 flex items-center justify-center">
                <img
                  src={inputImage}
                  alt="Reference uploaded"
                  className="max-h-64 w-auto object-contain"
                />
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-12 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50/50 dark:bg-slate-900/50 transition flex flex-col items-center justify-center gap-2 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl group-hover:scale-110 transition">
                  📤
                </div>
                <div className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  点击或拖拽上传参考图
                </div>
                <div className="text-[10px] text-slate-400">
                  支持 PNG, JPG, WEBP (最大 10MB)
                </div>
              </button>
            )}
          </div>

          {/* Denoising Strength */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-800 dark:text-slate-200">
              <span>2. 参考图重绘强度 (Denoising Strength)</span>
              <span className="text-blue-600 font-bold">{imageStrength}</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={0.95}
              step={0.05}
              value={imageStrength}
              onChange={(e) => setImageStrength(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0.1 (高保留原图构图)</span>
              <span>0.95 (大幅二次创意)</span>
            </div>
          </div>

          {/* Prompt */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-2">
            <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
              3. 二次生成提示词 (Prompt)
            </label>
            <textarea
              rows={3}
              value={currentPrompt}
              onChange={(e) => setCurrentPrompt(e.target.value)}
              placeholder="描述需要在参考图基础上修改或增加的元素..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
            />
          </div>

          {/* Aspect Ratios */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
            <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
              4. 输出画布比例
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.value}
                  onClick={() => setAspectRatio(ratio.value)}
                  className={`p-2 rounded-xl text-xs font-bold border text-center transition flex flex-col items-center justify-center gap-1 ${
                    aspectRatio === ratio.value
                      ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span className="text-sm">{ratio.icon}</span>
                  <span className="text-[11px]">{ratio.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerateImg2Img}
            disabled={isGenerating || !inputImage || !currentPrompt.trim()}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-base rounded-2xl shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <span>⏳ 正在基于参考图二次推演中...</span>
            ) : (
              <span>✨ 立即基于参考图生成</span>
            )}
          </button>
        </div>

        {/* Right Output Display */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-sm min-h-[420px] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                🖼️ Img2Img 图生图结果
              </span>
              {lastGeneratedImage && (
                <a
                  href={lastGeneratedImage.imageUrl}
                  download={`foxai3_img2img_${Date.now()}.png`}
                  className="px-2.5 py-1 bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-300 rounded-lg text-xs font-bold hover:bg-blue-100 transition"
                >
                  💾 下载图片
                </a>
              )}
            </div>

            <div className="my-auto py-4 flex flex-col items-center justify-center">
              {isGenerating ? (
                <div className="space-y-3 text-center">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500">正在融入参考图艺术构图...</p>
                </div>
              ) : lastGeneratedImage ? (
                <div className="space-y-3 w-full">
                  <img
                    src={lastGeneratedImage.imageUrl}
                    alt="Img2Img Result"
                    className="w-full h-auto object-contain max-h-[480px] rounded-xl shadow-md mx-auto"
                  />
                </div>
              ) : (
                <div className="text-center py-16 space-y-2 text-slate-400">
                  <div className="text-3xl">📷</div>
                  <div className="text-xs font-bold">图生图暂未生成</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
