'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { DEFAULT_SETTINGS, ASPECT_RATIOS } from '@/lib/constants';
import {
  Settings,
  Key,
  Cloud,
  Moon,
  Sun,
  RotateCcw,
  Save,
  CheckCircle2,
  HelpCircle,
  Eye,
  EyeOff,
  Sliders,
} from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const { settings, updateSettings, clearHistory, showToast } = useApp();

  const [cfApiToken, setCfApiToken] = useState(settings.cfApiToken || '');
  const [cfAccountId, setCfAccountId] = useState(settings.cfAccountId || '');
  const [showToken, setShowToken] = useState(false);

  const [defaultAspectRatio, setDefaultAspectRatio] = useState(
    settings.defaultAspectRatio || '1:1'
  );
  const [defaultSteps, setDefaultSteps] = useState(settings.defaultSteps || 20);
  const [defaultGuidance, setDefaultGuidance] = useState(settings.defaultGuidance || 7.5);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSaveApi = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      cfApiToken: cfApiToken.trim(),
      cfAccountId: cfAccountId.trim(),
    });
    showToast('Cloudflare API 配置已保存', 'success');
  };

  const handleSaveDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      defaultAspectRatio,
      defaultSteps,
      defaultGuidance,
    });
    showToast('默认生成参数已更新', 'success');
  };

  const handleFactoryReset = async () => {
    updateSettings({
      ...DEFAULT_SETTINGS,
      cfApiToken: '',
      cfAccountId: '',
    });
    setCfApiToken('');
    setCfAccountId('');
    setDefaultAspectRatio(DEFAULT_SETTINGS.defaultAspectRatio);
    setDefaultSteps(DEFAULT_SETTINGS.defaultSteps);
    setDefaultGuidance(DEFAULT_SETTINGS.defaultGuidance);
    await clearHistory();
    setShowResetConfirm(false);
    showToast('已成功恢复出厂设置', 'success');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Settings Header */}
      <div className="flex items-center space-x-2 bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
        <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center">
          <Settings size={18} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">系统基础设置</h3>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            自定义配置 API Key、个人偏好及系统主题
          </p>
        </div>
      </div>

      {/* Cloudflare API Key Configuration */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 pb-2 border-b border-gray-100 dark:border-gray-800">
          <Cloud size={18} className="text-amber-500" />
          <h4 className="text-xs font-bold text-gray-900 dark:text-white">
            Cloudflare Workers AI 接口配置
          </h4>
        </div>

        <form onSubmit={handleSaveApi} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cloudflare Account ID
            </label>
            <input
              type="text"
              value={cfAccountId}
              onChange={(e) => setCfAccountId(e.target.value)}
              placeholder="请输入 32 位的 Account ID (例: 8a9f...)"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[40px]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cloudflare API Token
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={cfApiToken}
                onChange={(e) => setCfApiToken(e.target.value)}
                placeholder="具有 Workers AI 权限的 Token"
                className="w-full pl-3 pr-9 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[40px]"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-start space-x-2">
            <HelpCircle size={15} className="shrink-0 mt-0.5" />
            <span>
              若不配置，系统将自动回退并使用免费公共 AI 算力服务 (如 FLUX.1)，确保随时可用不报错。
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center space-x-1.5 min-h-[42px]"
          >
            <Save size={15} />
            <span>保存 Cloudflare 配置</span>
          </button>
        </form>
      </div>

      {/* Default Generation Parameters */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 pb-2 border-b border-gray-100 dark:border-gray-800">
          <Sliders size={18} className="text-orange-500" />
          <h4 className="text-xs font-bold text-gray-900 dark:text-white">默认绘图生成参数设置</h4>
        </div>

        <form onSubmit={handleSaveDefaults} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              默认画面比例
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {ASPECT_RATIOS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setDefaultAspectRatio(item.value)}
                  className={`py-1.5 text-xs font-bold rounded-lg border ${
                    defaultAspectRatio === item.value
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {item.value}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300 mb-1">
              <span>默认采样步数: {defaultSteps}</span>
            </div>
            <input
              type="range"
              min="10"
              max="40"
              value={defaultSteps}
              onChange={(e) => setDefaultSteps(Number(e.target.value))}
              className="w-full accent-orange-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300 mb-1">
              <span>默认引导系数 (CFG): {defaultGuidance}</span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              step="0.5"
              value={defaultGuidance}
              onChange={(e) => setDefaultGuidance(Number(e.target.value))}
              className="w-full accent-orange-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gray-900 hover:bg-black dark:bg-gray-800 dark:hover:bg-gray-700 text-white font-medium rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center space-x-1.5 min-h-[42px]"
          >
            <CheckCircle2 size={15} />
            <span>保存默认参数</span>
          </button>
        </form>
      </div>

      {/* Theme & Factory Reset Section */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center space-x-2">
            {settings.darkMode ? (
              <Moon size={18} className="text-amber-400" />
            ) : (
              <Sun size={18} className="text-orange-500" />
            )}
            <span className="text-xs font-bold text-gray-900 dark:text-white">夜间模式</span>
          </div>
          <button
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              settings.darkMode ? 'bg-orange-500 justify-end' : 'bg-gray-300 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
          </button>
        </div>

        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full py-2.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl text-xs font-medium transition-colors flex items-center justify-center space-x-1.5 min-h-[42px]"
          >
            <RotateCcw size={15} />
            <span>恢复出厂设置 (还原偏好与清空历史)</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center mx-auto">
              <RotateCcw size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">确认恢复出厂设置？</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                将清除保存的 Cloudflare API Token、重置各项参数为默认值并清空所有绘图历史。
              </p>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl text-xs"
              >
                取消
              </button>
              <button
                onClick={handleFactoryReset}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl text-xs shadow-sm"
              >
                确认恢复
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
