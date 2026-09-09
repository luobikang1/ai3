'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { DEFAULT_SETTINGS, ASPECT_RATIOS, COMPUTE_ENGINES } from '@/lib/constants';
import {
  Settings,
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
  Cpu,
  Database,
  Globe,
  Server,
  Key,
} from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const { settings, updateSettings, clearHistory, showToast } = useApp();

  const [computeEngine, setComputeEngine] = useState(settings.computeEngine || 'stable-diffusion');
  const [sdApiEndpoint, setSdApiEndpoint] = useState(settings.sdApiEndpoint || '');
  const [sdApiKey, setSdApiKey] = useState(settings.sdApiKey || '');

  const [cfApiToken, setCfApiToken] = useState(settings.cfApiToken || '');
  const [cfAccountId, setCfAccountId] = useState(settings.cfAccountId || '');

  const [hfApiKey, setHfApiKey] = useState(settings.hfApiKey || '');
  const [falApiKey, setFalApiKey] = useState(settings.falApiKey || '');
  const [openaiApiKey, setOpenaiApiKey] = useState(settings.openaiApiKey || '');

  const [showToken, setShowToken] = useState(false);

  const [defaultAspectRatio, setDefaultAspectRatio] = useState(
    settings.defaultAspectRatio || '1:1'
  );
  const [defaultBatchCount, setDefaultBatchCount] = useState<number>(settings.defaultBatchCount || 1);
  const [defaultSteps, setDefaultSteps] = useState(settings.defaultSteps || 25);
  const [defaultGuidance, setDefaultGuidance] = useState(settings.defaultGuidance || 7.5);
  const [enableD1Sync, setEnableD1Sync] = useState(settings.enableD1Sync ?? true);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSaveCompute = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      computeEngine,
      sdApiEndpoint: sdApiEndpoint.trim(),
      sdApiKey: sdApiKey.trim(),
      cfApiToken: cfApiToken.trim(),
      cfAccountId: cfAccountId.trim(),
      hfApiKey: hfApiKey.trim(),
      falApiKey: falApiKey.trim(),
      openaiApiKey: openaiApiKey.trim(),
    });
    showToast('算力引擎与全网 API 秘钥配置已保存', 'success');
  };

  const handleSaveDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      defaultAspectRatio,
      defaultBatchCount,
      defaultSteps,
      defaultGuidance,
      enableD1Sync,
    });
    showToast('默认生成参数已更新', 'success');
  };

  const handleFactoryReset = async () => {
    updateSettings({
      ...DEFAULT_SETTINGS,
      sdApiEndpoint: '',
      sdApiKey: '',
      cfApiToken: '',
      cfAccountId: '',
      hfApiKey: '',
      falApiKey: '',
      openaiApiKey: '',
    });
    setComputeEngine(DEFAULT_SETTINGS.computeEngine);
    setSdApiEndpoint('');
    setSdApiKey('');
    setCfApiToken('');
    setCfAccountId('');
    setHfApiKey('');
    setFalApiKey('');
    setOpenaiApiKey('');
    setDefaultAspectRatio(DEFAULT_SETTINGS.defaultAspectRatio);
    setDefaultBatchCount(DEFAULT_SETTINGS.defaultBatchCount);
    setDefaultSteps(DEFAULT_SETTINGS.defaultSteps);
    setDefaultGuidance(DEFAULT_SETTINGS.defaultGuidance);
    setEnableD1Sync(true);
    await clearHistory();
    setShowResetConfirm(false);
    showToast('已成功恢复出厂设置（出厂默认状态已还原）', 'success');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Settings Header */}
      <div className="flex items-center space-x-2 bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
        <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center">
          <Settings size={18} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">系统算力与基础配置</h3>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            以 Stable Diffusion / FLUX 为标准引擎，支持 HuggingFace、Fal.ai、DALL-E 3 及 Wasmer 部署
          </p>
        </div>
      </div>

      {/* Compute Engine & API Selection Section */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-gray-100 dark:border-gray-800">
          <Cpu size={18} className="text-orange-500" />
          <h4 className="text-xs font-bold text-gray-900 dark:text-white">
            多平台算力引擎配置 (默认: Stable Diffusion / FLUX)
          </h4>
        </div>

        <form onSubmit={handleSaveCompute} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              选择主要算力节点
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMPUTE_ENGINES.map((engine) => {
                const isSelected = computeEngine === engine.type;
                return (
                  <div
                    key={engine.id}
                    onClick={() => setComputeEngine(engine.type as any)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-orange-50/80 dark:bg-orange-950/40 border-orange-500 text-orange-950 dark:text-orange-200 font-medium'
                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{engine.name}</span>
                      {engine.isDefault && (
                        <span className="text-[9px] bg-orange-500 text-white px-1.5 py-0.5 rounded font-bold">
                          出厂预设
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] opacity-75 mt-1 leading-snug">
                      {engine.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* External Compute API Keys Inputs */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl space-y-3 border border-gray-200 dark:border-gray-700/60">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-800 dark:text-gray-200">
              <Key size={14} className="text-amber-500" />
              <span>第三方算力 API Key 与 Endpoint 密钥</span>
            </div>

            <div>
              <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-1">
                HuggingFace Inference Token (开源无限制)
              </label>
              <input
                type="password"
                value={hfApiKey}
                onChange={(e) => setHfApiKey(e.target.value)}
                placeholder="hf_..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[38px]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-1">
                Fal.ai Key / OpenAI Key (DALL-E 3 / Vercel AI SDK)
              </label>
              <input
                type="password"
                value={falApiKey}
                onChange={(e) => setFalApiKey(e.target.value)}
                placeholder="Fal.ai Key 或 OpenAI Key"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[38px]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-1">
                Cloudflare Account ID & API Token
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={cfAccountId}
                  onChange={(e) => setCfAccountId(e.target.value)}
                  placeholder="32位 Account ID"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[38px]"
                />
                <input
                  type="password"
                  value={cfApiToken}
                  onChange={(e) => setCfApiToken(e.target.value)}
                  placeholder="Workers AI Token"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[38px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-1">
                私有 SD WebUI / Wasmer WebAssembly 接口节点
              </label>
              <input
                type="text"
                value={sdApiEndpoint}
                onChange={(e) => setSdApiEndpoint(e.target.value)}
                placeholder="例如: http://127.0.0.1:7860 或 Wasmer 服务端点"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[38px]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center space-x-1.5 min-h-[44px]"
          >
            <Save size={16} />
            <span>保存并应用算力配置</span>
          </button>
        </form>
      </div>

      {/* Cloudflare D1 Database Sync Options */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 pb-2 border-b border-gray-100 dark:border-gray-800">
          <Database size={18} className="text-blue-500" />
          <h4 className="text-xs font-bold text-gray-900 dark:text-white">
            Cloudflare D1 数据库历史同步
          </h4>
        </div>

        <div className="flex items-center justify-between py-1">
          <div>
            <div className="text-xs font-semibold text-gray-900 dark:text-white">
              开启 D1 数据库跨端多设备同步
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              连接 Cloudflare D1 数据库时，历史绘图记录可全自动云端同步
            </p>
          </div>
          <button
            onClick={() => setEnableD1Sync(!enableD1Sync)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              enableD1Sync ? 'bg-orange-500 justify-end' : 'bg-gray-300 dark:bg-gray-700 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
          </button>
        </div>
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
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              默认单次生成张数
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setDefaultBatchCount(num)}
                  className={`py-1.5 text-xs font-bold rounded-lg border ${
                    defaultBatchCount === num
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  生成 {num} 张
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
              settings.darkMode ? 'bg-orange-500 justify-end' : 'bg-gray-300 dark:bg-gray-700 justify-start'
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
            <span>恢复出厂设置 (还原 FLUX/SD 默认引擎与清空历史)</span>
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
                将还原默认出厂算力引擎与预设参数、重置 API Key 并清空所有绘图历史。
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
