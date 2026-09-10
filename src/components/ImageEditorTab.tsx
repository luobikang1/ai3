'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Upload, X, Wand2, Download, AlertCircle, Image as ImageIcon, Sparkles, Eraser, ZoomIn, Sliders } from 'lucide-react';
import { GeneratedImage } from '@/types';

export const ImageEditorTab: React.FC = () => {
  const { addHistoryItem, showToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputImage, setInputImage] = useState<string | null>(null);
  const [action, setAction] = useState<'upscale' | 'watermark-erase' | 'sharpen'>('upscale');
  const [isProcessing, setIsProcessing] = useState(false);
  const [editedImg, setEditedImg] = useState<GeneratedImage | null>(null);
  const [errorText, setErrorText] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('请上传格式正确的图片', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setInputImage(event.target.result as string);
        showToast('需要修图的图片上传成功', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProcessImage = async () => {
    if (!inputImage) {
      showToast('请先上传一张需要修改的图片', 'error');
      return;
    }

    setIsProcessing(true);
    setErrorText('');

    try {
      const res = await fetch('/api/generate/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputImage,
          action,
        }),
      });

      const data = await res.json();

      if (data.success && data.data?.imageUrl) {
        const newItem: GeneratedImage = {
          id: `edit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          imageUrl: data.data.imageUrl,
          params: {
            prompt: action === 'upscale' ? '高清超清放大增强' : '智能去水印修复',
            width: 1536,
            height: 1536,
            aspectRatio: '1:1',
            model: 'image-editor',
          },
          createdAt: Date.now(),
          modelName: action === 'upscale' ? 'AI 图像超清放大' : 'AI 去水印修复器',
        };

        setEditedImg(newItem);
        await addHistoryItem(newItem);
        showToast(data.message || '修图增强成功完成！', 'success');
      } else {
        const msg = data.error || '修图处理失败，请稍后重试';
        setErrorText(msg);
        showToast(msg, 'error');
      }
    } catch (err: any) {
      const msg = err.message || '网络通讯异常，请检查接口';
      setErrorText(msg);
      showToast(msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!editedImg) return;
    const a = document.createElement('a');
    a.href = editedImg.imageUrl;
    a.download = `fox-ai-edit-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-gray-100 dark:border-gray-800">
          <Sparkles className="text-orange-500" size={18} />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            AI 智能修图 (高清放大 & 去水印)
          </h3>
        </div>

        {/* Upload Box */}
        <div>
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
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-orange-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50/50 dark:bg-gray-800/30"
            >
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center mb-2">
                <Upload size={22} />
              </div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                点击上传需要修改的图片
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">支持 PNG, JPG, WEBP</p>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-950 max-h-[250px] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inputImage}
                alt="原图"
                className="max-h-[250px] w-auto object-contain rounded-xl"
              />
              <button
                onClick={() => setInputImage(null)}
                className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Edit Action Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            选择修图增强模式
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAction('upscale')}
              className={`p-3 rounded-xl border text-left flex items-center space-x-2 transition-all ${
                action === 'upscale'
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
              }`}
            >
              <ZoomIn size={18} />
              <div>
                <div className="font-bold text-xs">变清晰 / 超清放大</div>
                <div className="text-[10px] opacity-80">智能去除降噪，补全 4K 微距细节</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAction('watermark-erase')}
              className={`p-3 rounded-xl border text-left flex items-center space-x-2 transition-all ${
                action === 'watermark-erase'
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
              }`}
            >
              <Eraser size={18} />
              <div>
                <div className="font-bold text-xs">去除水印 / 杂物修复</div>
                <div className="text-[10px] opacity-80">智能擦除文本水印与杂乱区域</div>
              </div>
            </button>
          </div>
        </div>

        <button
          onClick={handleProcessImage}
          disabled={isProcessing}
          className="w-full py-3.5 bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl text-sm transition-all shadow-md active:scale-[0.99] disabled:opacity-50 min-h-[48px] flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>AI 正在执行修图处理中...</span>
            </>
          ) : (
            <>
              <Wand2 size={18} />
              <span>开始修图处理</span>
            </>
          )}
        </button>
      </div>

      {errorText && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl text-xs text-red-600 dark:text-red-400 flex items-start space-x-2.5">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
          <div>
            <div className="font-semibold text-sm mb-1">修图异常提示</div>
            <p className="leading-relaxed">{errorText}</p>
          </div>
        </div>
      )}

      {editedImg && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-1">
              <Sparkles size={14} className="text-orange-500" />
              <span>修图后最终效果</span>
            </span>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-medium transition-colors"
            >
              <Download size={13} />
              <span>下载修图结果</span>
            </button>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-gray-950 flex items-center justify-center min-h-[250px] border border-gray-100 dark:border-gray-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={editedImg.imageUrl}
              alt="修图结果"
              className="w-full h-auto max-h-[500px] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
