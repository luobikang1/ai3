'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { GeneratedImage } from '@/types';

export const HistoryTab: React.FC = () => {
  const { history, deleteHistoryItem, clearHistory, showToast, setCurrentPrompt } = useApp();
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    showToast('提示词已复制到剪贴板！', 'success');
  };

  const handleReusePrompt = (prompt: string) => {
    setCurrentPrompt(prompt);
    showToast('提示词已载入文生图工作台！', 'info');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
            📜 已生成图像历史档案 ({history.length})
          </h2>
          <p className="text-blue-100 text-xs mt-1">
            历史纪录均存储于浏览器本地 (IndexedDB 大容量超分存储)，无数据库曝光风险
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 border border-rose-300/30 rounded-xl text-xs font-bold transition"
          >
            🗑️ 清空全部历史
          </button>
        )}
      </div>

      {/* History Grid */}
      {history.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-16 text-center space-y-3 border border-slate-200 dark:border-slate-700">
          <div className="text-4xl">🎨</div>
          <div className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
            暂无已存历史记录
          </div>
          <div className="text-xs text-slate-400">
            在「文生图」或「图生图」中生成的画像会自动归档保存在此处
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedImage(item)}
              className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 aspect-square cursor-pointer transition transform hover:-translate-y-1 hover:shadow-xl"
            >
              <img
                src={item.imageUrl}
                alt={item.params?.prompt || 'AI generated image'}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-3 flex flex-col justify-end text-white text-left">
                <p className="text-[11px] font-bold line-clamp-2 leading-tight">
                  {item.params?.prompt}
                </p>
                <div className="flex items-center justify-between pt-2 text-[10px] text-slate-300">
                  <span>{item.modelName}</span>
                  <span>点击查看大图 🔍</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Detail Viewer */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="font-black text-sm text-slate-900 dark:text-white">
                🖼️ 历史画像详情参数
              </span>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-slate-950 max-h-[400px] flex items-center justify-center">
              <img
                src={selectedImage.imageUrl}
                alt="Selected history image"
                className="max-h-[400px] w-auto object-contain"
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 text-xs">
              <div>
                <span className="font-extrabold text-slate-700 dark:text-slate-300">
                  正向提示词 (Prompt):
                </span>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {selectedImage.params?.prompt}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500">
                <span>模型: {selectedImage.modelName}</span>
                <span>• 步数: {selectedImage.params?.steps || 25}</span>
                <span>• CFG: {selectedImage.params?.guidance || 8.0}</span>
                <span>• 耗时: {selectedImage.generationTimeMs || 1200} ms</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                onClick={() => deleteHistoryItem(selectedImage.id)}
                className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-100"
              >
                🗑️ 删除此纪录
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyPrompt(selectedImage.params?.prompt || '')}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  📋 复制提示词
                </button>
                <button
                  onClick={() => handleReusePrompt(selectedImage.params?.prompt || '')}
                  className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                >
                  ⚡ 复用提示词绘图
                </button>
                <a
                  href={selectedImage.imageUrl}
                  download={`foxai3_history_${Date.now()}.png`}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                >
                  💾 无损原图下载
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
