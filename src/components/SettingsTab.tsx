'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Settings, Key, Server, Moon, Sun, RotateCcw, Database, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { DEFAULT_SETTINGS } from '@/lib/constants';

export const SettingsTab: React.FC = () => {
  const { settings, updateSettings, auth, showToast } = useApp();

  const [cfApiToken, setCfApiToken] = useState(settings.cfApiToken || '');
  const [cfAccountId, setCfAccountId] = useState(settings.cfAccountId || '');
  const [hfApiKey, setHfApiKey] = useState(settings.hfApiKey || '');
  const [falApiKey, setFalApiKey] = useState(settings.falApiKey || '');
  const [sdApiEndpoint, setSdApiEndpoint] = useState(settings.sdApiEndpoint || '');
  const [sdApiKey, setSdApiKey] = useState(settings.sdApiKey || '');

  // Account modification form state
  const [newPassword, setNewPassword] = useState('');
  const [bgImageInput, setBgImageInput] = useState('');

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      cfApiToken: cfApiToken.trim(),
      cfAccountId: cfAccountId.trim(),
      hfApiKey: hfApiKey.trim(),
      falApiKey: falApiKey.trim(),
      sdApiEndpoint: sdApiEndpoint.trim(),
      sdApiKey: sdApiKey.trim(),
    });
    showToast('API Key 与算力节点设置保存成功！', 'success');
  };

  const handleSaveWallpaper = () => {
    if (bgImageInput.trim()) {
      localStorage.setItem('fox_ai_custom_login_bg', bgImageInput.trim());
      showToast('管理员全屏背景壁纸更新成功！', 'success');
      setBgImageInput('');
    }
  };

  const handleResetFactory = () => {
    if (confirm('确定要恢复白狐AI三出厂默认设置吗？已配置的 API Key 和极速选项将被重置。')) {
      updateSettings(DEFAULT_SETTINGS);
      setCfApiToken('');
      setCfAccountId('');
      setHfApiKey('');
      setFalApiKey('');
      setSdApiEndpoint('');
      setSdApiKey('');
      showToast('已恢复出厂配置', 'success');
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-3xl mx-auto">
      {/* Title Bar */}
      <div className="flex items-center space-x-2 p-3.5 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-sky-500/5 dark:from-blue-950/30 dark:to-transparent border border-blue-200/50 dark:border-blue-800/40 rounded-xl">
        <Settings size={20} className="text-blue-600 dark:text-blue-400" />
        <div>
          <h2 className="font-bold text-sm text-gray-900 dark:text-white">系统设置与节点密钥配置</h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">全部 Key 均本地加密存储，支持配置独立算力源</p>
        </div>
      </div>

      {/* Theme & Display Options */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
        <h3 className="font-bold text-xs text-gray-900 dark:text-white flex items-center space-x-1.5">
          <Sun size={15} className="text-amber-500" />
          <span>界面与极客偏好设置</span>
        </h3>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">夜间深色模式</div>
            <div className="text-[10px] text-gray-400">切换 OLED 极黑风格护眼模式</div>
          </div>
          <button
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            className={`p-2 rounded-xl border transition-colors ${
              settings.darkMode
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            {settings.darkMode ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </div>

      {/* API Keys Form */}
      <form onSubmit={handleSaveKeys} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-4">
        <h3 className="font-bold text-xs text-gray-900 dark:text-white flex items-center space-x-1.5">
          <Key size={15} className="text-blue-600 dark:text-blue-400" />
          <span>Cloudflare / HuggingFace / Fal API 密钥配置</span>
        </h3>

        {/* Cloudflare Workers AI */}
        <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
          <div className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-1">
            <Server size={13} className="text-blue-500" />
            <span>Cloudflare Workers AI (Flux & 70+模型)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                Account ID (账户 ID)
              </label>
              <input
                type="text"
                value={cfAccountId}
                onChange={(e) => setCfAccountId(e.target.value)}
                placeholder="例如: 8aef523..."
                className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                API Token (访问令牌)
              </label>
              <input
                type="password"
                value={cfApiToken}
                onChange={(e) => setCfApiToken(e.target.value)}
                placeholder="Cloudflare AI Token"
                className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* HuggingFace & Fal.ai */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1.5">
            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
              HuggingFace Inference API Key
            </label>
            <input
              type="password"
              value={hfApiKey}
              onChange={(e) => setHfApiKey(e.target.value)}
              placeholder="hf_xxxxxxxxxxxxxxxx"
              className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
            />
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1.5">
            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
              Fal.ai High-Performance Key
            </label>
            <input
              type="password"
              value={falApiKey}
              onChange={(e) => setFalApiKey(e.target.value)}
              placeholder="fal_key_xxxxxxx"
              className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
            />
          </div>
        </div>

        {/* Custom SD Endpoint */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 space-y-2">
          <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
            自定义 Stable Diffusion WebUI / ComfyUI 专属私有 API 地址
          </label>
          <input
            type="text"
            value={sdApiEndpoint}
            onChange={(e) => setSdApiEndpoint(e.target.value)}
            placeholder="http://127.0.0.1:7860 或云端反代域名"
            className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
        >
          保存所有节点密钥配置
        </button>
      </form>

      {/* Admin Account & Wallpaper Settings */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
        <h3 className="font-bold text-xs text-gray-900 dark:text-white flex items-center space-x-1.5">
          <ShieldCheck size={15} className="text-blue-600" />
          <span>管理员全局登录壁纸配置</span>
        </h3>

        <div className="space-y-2 text-xs">
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">自定义全屏登录背景壁纸 URL</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={bgImageInput}
                onChange={(e) => setBgImageInput(e.target.value)}
                placeholder="输入网络图片 URL 地址"
                className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={handleSaveWallpaper}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shrink-0"
              >
                设置壁纸
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Factory Reset Action */}
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={handleResetFactory}
          className="flex items-center space-x-1 px-4 py-2 bg-gray-100 hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-950/40 text-gray-600 dark:text-gray-300 hover:text-red-600 rounded-xl text-xs font-medium transition-colors"
        >
          <RotateCcw size={14} />
          <span>恢复白狐AI三出厂默认设置</span>
        </button>
      </div>
    </div>
  );
};
