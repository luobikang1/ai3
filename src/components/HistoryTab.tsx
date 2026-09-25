'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { History, Trash2, Download, RefreshCw, ZoomIn, Calendar, Sparkles } from 'lucide-react';
import { GeneratedImage } from '@/types';

export const HistoryTab: React.FC = () => {
  const { history, deleteHistoryItem, clearHistory, showToast } = useApp();
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  const handleDownload = (imgUrl: string, promptText: string) => {
    const a = document.createElement('a');
    a.href = imgUrl;
    a.download = `fox-ai-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('下载指令已触发', 'success');
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-sky-500/5 dark:from-blue-950/30 dark:to-transparent border border-blue-200/50 dark:border-blue-800/40 rounded-xl">
        <div className="flex items-center space-x-2">
          <History size={18} className="text-blue-600 dark:text-blue-400" />
          <span className="font-bold text-sm text-gray-900 dark:text-white">
            本地绘图历史记录 ({history.length} 条)
          </span>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => {
              if (confirm('确定清空本地 IndexedDB 中的全部历史画作记录吗？此操作不可撤销。')) {
                clearHistory();
              }
            }}
            className="flex items-center space-x-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold transition-colors"
          >
            <Trash2 size={13} />
            <span>清空记录</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {history.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Sparkles size={32} />
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">暂无作画历史</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
            您创作的每一张 AI 图片都将自动通过浏览器 IndexedDB 本地保存于本地，安全不泄露。
          </p>
        </div>
      ) : (
        /* History Masonry / Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Image Preview Container */}
              <div
                onClick={() => setSelectedImage(item)}
                className="relative aspect-square bg-gray-950 cursor-pointer overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.params.prompt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <span className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white">
                    <ZoomIn size={16} />
                  </span>
                </div>

                <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md text-white text-[9px] font-medium rounded-md">
                  {item.modelName}
                </div>
              </div>

              {/* Details & Actions */}
              <div className="p-2.5 space-y-1.5">
                <p className="text-[11px] text-gray-700 dark:text-gray-300 line-clamp-2 leading-tight">
                  {item.params.prompt}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400">
                  <span className="flex items-center space-x-0.5">
                    <Calendar size={10} />
                    <span>{formatDate(item.createdAt)}</span>
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleDownload(item.imageUrl, item.params.prompt)}
                      className="p-1 hover:text-blue-600 transition-colors"
                      title="下载图片"
                    >
                      <Download size={13} />
                    </button>
                    <button
                      onClick={() => deleteHistoryItem(item.id)}
                      className="p-1 hover:text-red-500 transition-colors"
                      title="删除记录"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Image Detail Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-2xl w-full p-4 space-y-3 overflow-hidden shadow-2xl"
          >
            <div className="relative max-h-[60vh] flex items-center justify-center bg-gray-950 rounded-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.params.prompt}
                className="max-h-[60vh] w-auto object-contain"
              />
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="font-bold text-gray-900 dark:text-white">正向提示词：</span>
                <p className="text-gray-600 dark:text-gray-300 mt-0.5">{selectedImage.params.prompt}</p>
              </div>

              {selectedImage.params.negativePrompt && (
                <div>
                  <span className="font-bold text-gray-900 dark:text-white">负向提示词：</span>
                  <p className="text-gray-500 dark:text-gray-400 mt-0.5">{selectedImage.params.negativePrompt}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400">
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">模型: {selectedImage.modelName}</span>
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">尺寸: {selectedImage.params.width} x {selectedImage.params.height}</span>
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">采样: {selectedImage.params.sampler || 'Euler a'}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => deleteHistoryItem(selectedImage.id).then(() => setSelectedImage(null))}
                className="px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100"
              >
                删除此条
              </button>
              <button
                onClick={() => handleDownload(selectedImage.imageUrl, selectedImage.params.prompt)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1"
              >
                <Download size={14} />
                <span>下载大图</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
