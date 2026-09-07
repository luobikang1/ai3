'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { GeneratedImage } from '@/types';
import {
  History,
  Trash2,
  Download,
  X,
  ExternalLink,
  Sparkles,
  Calendar,
  Layers,
  AlertTriangle,
} from 'lucide-react';

export const HistoryTab: React.FC = () => {
  const { history, deleteHistoryItem, clearHistory, showToast } = useApp();

  const [selectedItem, setSelectedItem] = useState<GeneratedImage | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleDownload = (img: GeneratedImage) => {
    const a = document.createElement('a');
    a.href = img.imageUrl;
    a.download = `fox-ai-${img.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('图片开始下载', 'success');
  };

  const handleDelete = async (id: string) => {
    await deleteHistoryItem(id);
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center">
            <History size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              生成历史记录 ({history.length})
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              采用浏览器本地 IndexedDB 存储，不经服务器数据库
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => setShowConfirmClear(true)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-xl text-xs font-medium transition-colors"
          >
            <Trash2 size={13} />
            <span>清空全部</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {history.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mb-3">
            <Sparkles size={28} />
          </div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">暂无生成的图片历史</h4>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">
            在“文生图”或“图生图”页面生成的第一张画作将自动保存在这里
          </p>
        </div>
      ) : (
        /* Image Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer relative flex flex-col"
            >
              <div className="relative aspect-square bg-gray-950 overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.params.prompt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(item);
                    }}
                    className="p-2 bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-white rounded-full hover:scale-110 transition-transform"
                    title="下载图片"
                  >
                    <Download size={15} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="p-2 bg-red-600 text-white rounded-full hover:scale-110 transition-transform"
                    title="删除记录"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <p className="text-xs text-gray-800 dark:text-gray-200 line-clamp-2 font-medium">
                  {item.params.prompt}
                </p>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400">
                  <span className="truncate max-w-[80px]">{item.modelName}</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10"
            >
              <X size={20} />
            </button>

            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden bg-gray-950 flex items-center justify-center max-h-[350px] border border-gray-100 dark:border-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.params.prompt}
                  className="max-h-[350px] w-auto object-contain rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-900 dark:text-white">
                  生成提示词
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {selectedItem.params.prompt}
                </div>

                {selectedItem.params.negativePrompt && (
                  <div>
                    <div className="text-xs font-semibold text-gray-900 dark:text-white mt-2">
                      负向提示词
                    </div>
                    <div className="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl text-xs text-gray-500 dark:text-gray-400">
                      {selectedItem.params.negativePrompt}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl">
                <div className="flex items-center space-x-1.5">
                  <Layers size={14} className="text-orange-500" />
                  <span className="truncate">模型: {selectedItem.modelName}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Calendar size={14} className="text-orange-500" />
                  <span>时间: {formatDate(selectedItem.createdAt)}</span>
                </div>
                <div>比例: {selectedItem.params.aspectRatio}</div>
                <div>
                  分辨率: {selectedItem.params.width} x {selectedItem.params.height}
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => handleDownload(selectedItem)}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-colors"
                >
                  <Download size={15} />
                  <span>下载此原图</span>
                </button>
                <button
                  onClick={() => handleDelete(selectedItem.id)}
                  className="py-2.5 px-4 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-xl text-xs font-medium flex items-center justify-center space-x-1 transition-colors"
                >
                  <Trash2 size={15} />
                  <span>删除</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                确认清空历史记录？
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                此操作将永久删除本地浏览器中保存的所有生成的图片，且无法撤销。
              </p>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl text-xs"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  await clearHistory();
                  setShowConfirmClear(false);
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl text-xs shadow-sm"
              >
                确认彻底清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
