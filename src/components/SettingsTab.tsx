import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { COMPUTE_ENGINES } from '@/lib/constants';

export const SettingsTab: React.FC = () => {
  const { settings, updateSettings, showToast, isDarkMode, toggleDarkMode } = useApp();

  const [computeEngine, setComputeEngine] = useState(settings.computeEngine || 'pollinations');
  const [cfApiToken, setCfApiToken] = useState(settings.cfApiToken || '');
  const [cfAccountId, setCfAccountId] = useState(settings.cfAccountId || '');
  const [siliconApiKey, setSiliconApiKey] = useState(settings.siliconApiKey || '');
  const [openaiApiKey, setOpenaiApiKey] = useState(settings.openaiApiKey || '');
  const [stabilityApiKey, setStabilityApiKey] = useState(settings.stabilityApiKey || '');
  const [hfApiKey, setHfApiKey] = useState(settings.hfApiKey || '');
  const [falApiKey, setFalApiKey] = useState(settings.falApiKey || '');

  const [defaultModel, setDefaultModel] = useState(settings.defaultModel || 'black-forest-labs/FLUX.1-schnell');
  const [defaultBatchCount, setDefaultBatchCount] = useState(settings.defaultBatchCount || 1);
  const [defaultSteps, setDefaultSteps] = useState(settings.defaultSteps || 25);
  const [defaultGuidance, setDefaultGuidance] = useState(settings.defaultGuidance || 8.0);
  const [defaultNegativePrompt, setDefaultNegativePrompt] = useState(settings.defaultNegativePrompt || '');

  const handleSave = () => {
    updateSettings({
      computeEngine,
      cfApiToken: cfApiToken.trim(),
      cfAccountId: cfAccountId.trim(),
      siliconApiKey: siliconApiKey.trim(),
      openaiApiKey: openaiApiKey.trim(),
      stabilityApiKey: stabilityApiKey.trim(),
      hfApiKey: hfApiKey.trim(),
      falApiKey: falApiKey.trim(),
      defaultModel,
      defaultBatchCount: Number(defaultBatchCount),
      defaultSteps: Number(defaultSteps),
      defaultGuidance: Number(defaultGuidance),
      defaultNegativePrompt: defaultNegativePrompt.trim(),
    });
    showToast('设置已成功保存！', 'success');
  };

  const handleResetFactory = () => {
    if (confirm('确定要恢复出厂设置吗？这将重置所有 Key 和偏好配置。')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            ⚙️ 融合算力与全域设置
          </h2>
          <p className="text-blue-100 text-xs mt-1">
            配置 Cloudflare, SiliconFlow, OpenAI, Stability AI 等全网算力 Key，实现低延迟无缝出图
          </p>
        </div>
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-xl shadow-lg transition duration-200 text-sm whitespace-nowrap self-stretch md:self-auto text-center"
        >
          保存全局配置
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-5">
        <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
          🚀 默认算力引擎 (Compute Engine)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {COMPUTE_ENGINES.map((engine) => (
            <label
              key={engine.id}
              className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition ${
                computeEngine === engine.id
                  ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-900/20 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <input
                type="radio"
                name="computeEngine"
                value={engine.id}
                checked={computeEngine === engine.id}
                onChange={(e) => setComputeEngine(e.target.value)}
                className="mt-1 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  {engine.name}
                  {engine.isDefault && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-semibold">
                      免费免 Key
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {engine.description}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            开放算力平台 Key 配置 (可选，配后提升画质与速度)
          </h4>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              SiliconFlow (硅基流动 API Key)
            </label>
            <input
              type="password"
              placeholder="sk-..."
              value={siliconApiKey}
              onChange={(e) => setSiliconApiKey(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              OpenAI API Key (DALL-E 3)
            </label>
            <input
              type="password"
              placeholder="sk-..."
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Stability AI API Key (SDXL 1.0)
            </label>
            <input
              type="password"
              placeholder="sk-..."
              value={stabilityApiKey}
              onChange={(e) => setStabilityApiKey(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cloudflare Account ID
              </label>
              <input
                type="text"
                placeholder="例如: a1b2c3d4..."
                value={cfAccountId}
                onChange={(e) => setCfAccountId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cloudflare AI Token
              </label>
              <input
                type="password"
                placeholder="例如: Bearer token..."
                value={cfApiToken}
                onChange={(e) => setCfApiToken(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
          🎯 出厂预设与生图偏好
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              默认单次生成张数
            </label>
            <select
              value={defaultBatchCount}
              onChange={(e) => setDefaultBatchCount(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
            >
              <option value={1}>1 张 (默认极速)</option>
              <option value={2}>2 张 (并行抽卡)</option>
              <option value={4}>4 张 (矩阵四格)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              默认采样步数 (Steps)
            </label>
            <input
              type="number"
              min={10}
              max={50}
              value={defaultSteps}
              onChange={(e) => setDefaultSteps(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              引导系数 (CFG Scale)
            </label>
            <input
              type="number"
              step={0.5}
              min={1}
              max={20}
              value={defaultGuidance}
              onChange={(e) => setDefaultGuidance(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            通用底线反向提示词 (Negative Prompt)
          </label>
          <textarea
            rows={2}
            value={defaultNegativePrompt}
            onChange={(e) => setDefaultNegativePrompt(e.target.value)}
            className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-700 flex items-center justify-center text-lg">
            {isDarkMode ? '🌙' : '☀️'}
          </div>
          <div>
            <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
              主题外观 (深色/浅色模式)
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              当前为 {isDarkMode ? '夜间夜光深色模式' : '日间极简浅色模式'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={toggleDarkMode}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
          >
            切换模式
          </button>
          <button
            onClick={handleResetFactory}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition"
          >
            恢复出厂设置
          </button>
        </div>
      </div>
    </div>
  );
};
