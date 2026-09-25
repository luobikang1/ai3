'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Upload, X, Wand2, Download, AlertCircle, Image as ImageIcon, ZoomIn, Eraser } from 'lucide-react';

export const ImageEditorTab: React.FC = () => {
  const { showToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputImage, setInputImage] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<'upscale' | 'remove_watermark'>('upscale');
  const [upscaleScale, setUpscaleScale] = useState<number>(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [errorText, setErrorText] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('请上传正确的图片文件', 'error');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast('图片不能超过 15MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setInputImage(event.target.result as string);
        setResultImage(null);
        showToast('原图加载完成', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExecute = async () => {
    if (!inputImage) {
      showToast('请先上传待处理的图片', 'error');
      return;
    }

    setIsProcessing(true);
    setErrorText('');

    try {
      const res = await fetch('/api/generate/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: activeAction,
          inputImage,
          scale: upscaleScale,
        }),
      });

      const data = await res.json();

      if (data.success && data.data?.imageUrl) {
        setResultImage(data.data.imageUrl);
        showToast(
          activeAction === 'upscale'
            ? `高清放大 (${upscaleScale}x) 处理完成！`
            : '智能去水印处理完成！',
          'success'
        );
      } else {
        const msg = data.error || '图片编辑失败，请稍后重试';
        setErrorText(msg);
        showToast(msg, 'error');
      }
    } catch (err: any) {
      const msg = err.message || '网络连接异常';
      setErrorText(msg);
      showToast(msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `fox-ai-edited-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Title Header */}
      <div className="p-3.5 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-sky-500/5 dark:from-blue-950/30 dark:to-transparent border border-blue-200/50 dark:border-blue-800/40 rounded-xl">
        <div className="flex items-center space-x-2">
          <Wand2 size={20} className="text-blue-600 dark:text-blue-400" />
          <h2 className="font-bold text-sm text-gray-900 dark:text-white">
            AI 图像编辑增强 (超分放大 / 去水印)
          </h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          基于神经网络算法，一键提升清晰度或消除画面多余纹理
        </p>
      </div>

      {/* Main Panel */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-4">
        {/* Function Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveAction('upscale')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeAction === 'upscale'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ZoomIn size={15} />
            <span>AI 4K 高清放大</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAction('remove_watermark')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeAction === 'remove_watermark'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Eraser size={15} />
            <span>智能去水印 / 杂纹</span>
          </button>
        </div>

        {/* Upload Area */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            上传待编辑原图
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
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50/50 dark:bg-gray-800/30"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                <Upload size={22} />
              </div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                点击或拖拽上传原图
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">支持 PNG, JPG, WEBP，最大 15MB</p>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-950 max-h-[260px] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inputImage}
                alt="待编辑图"
                className="max-h-[260px] w-auto object-contain rounded-xl"
              />
              <button
                onClick={() => {
                  setInputImage(null);
                  setResultImage(null);
                }}
                className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-full hover:bg-red-600 transition-colors"
                title="移除原图"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Scale Options (Only for Upscale) */}
        {activeAction === 'upscale' && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              放大倍率
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[2, 4].map((scale) => (
                <button
                  key={scale}
                  type="button"
                  onClick={() => setUpscaleScale(scale)}
                  className={`py-2 text-xs font-bold rounded-xl border flex items-center justify-center space-x-1 transition-all ${
                    upscaleScale === scale
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <span>{scale} 倍高清重构 ({scale === 2 ? '2K 分辨率' : '4K 极清'})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleExecute}
          disabled={isProcessing || !inputImage}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md active:scale-[0.99] disabled:opacity-50 min-h-[48px] flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>AI 增强处理中...</span>
            </>
          ) : (
            <>
              <Wand2 size={18} />
              <span>
                {activeAction === 'upscale' ? '执行 AI 超分高清放大' : '执行智能去水印/杂纹'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {errorText && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl text-xs text-red-600 dark:text-red-400 flex items-start space-x-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
          <p>{errorText}</p>
        </div>
      )}

      {/* Output Display */}
      {resultImage && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-1">
              <ImageIcon size={14} className="text-blue-600 dark:text-blue-400" />
              <span>编辑处理完成效果</span>
            </span>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
            >
              <Download size={13} />
              <span>下载高清结果</span>
            </button>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-gray-950 flex items-center justify-center min-h-[250px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resultImage}
              alt="编辑结果图"
              className="w-full h-auto max-h-[500px] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
