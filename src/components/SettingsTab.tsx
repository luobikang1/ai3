import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { COMPUTE_ENGINES } from '@/lib/constants';

export const SettingsTab: React.FC = () => {
  const { settings, updateSettings, showToast, isDarkMode, toggleDarkMode, auth } = useApp();

  const [computeEngine, setComputeEngine] = useState(settings.computeEngine || 'pollinations');
  const [cfApiToken, setCfApiToken] = useState(settings.cfApiToken || '');
  const [cfAccountId, setCfAccountId] = useState(settings.cfAccountId || '');
  const [siliconApiKey, setSiliconApiKey] = useState(settings.siliconApiKey || '');
  const [openaiApiKey, setOpenaiApiKey] = useState(settings.openaiApiKey || '');
  const [stabilityApiKey, setStabilityApiKey] = useState(settings.stabilityApiKey || '');
  const [enableNsfw, setEnableNsfw] = useState(false);

  // Cloudflare D1 Connection State
  const [d1Status, setD1Status] = useState<{ connected: boolean; message: string }>({
    connected: false,
    message: '正在检测 D1 数据库状态...',
  });
  const [isSyncingD1, setIsSyncingD1] = useState(false);

  useEffect(() => {
    checkD1Connection();
  }, []);

  const checkD1Connection = async () => {
    try {
      const res = await fetch('/api/d1/sync');
      const json = await res.json();
      setD1Status({
        connected: json.connected,
        message: json.message || (json.connected ? 'Cloudflare D1 已激活离线/在线云同步' : '未绑定 D1 数据库，使用本地存储'),
      });
    } catch {
      setD1Status({ connected: false, message: '浏览器本地独占存储 (无数据库依赖)' });
    }
  };

  const handleSyncD1Push = async () => {
    setIsSyncingD1(true);
    try {
      const res = await fetch('/api/d1/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'push',
          username: auth.username || 'admin',
          settingsData: settings,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || '手动推送设置到 D1 成功！', 'success');
      } else {
        showToast(json.message || json.error || 'D1 同步未完成', 'info');
      }
    } catch (e) {
      showToast('同步处理失败，请确认 wrangler.toml 配置', 'error');
    } finally {
      setIsSyncingD1(false);
    }
  };

  const handleSave = () => {
    updateSettings({
      computeEngine,
      cfApiToken: cfApiToken.trim(),
      cfAccountId: cfAccountId.trim(),
      siliconApiKey: siliconApiKey.trim(),
      openaiApiKey: openaiApiKey.trim(),
      stabilityApiKey: stabilityApiKey.trim(),
    });
    showToast('全局设置已成功保存！', 'success');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-20">
      {/* Cloudflare D1 Cloud Sync Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">☁️</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-100">
              Cloudflare D1 数据库状态与一键同步
            </span>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
              d1Status.connected
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            {d1Status.connected ? '✓ D1 已连通' : '○ 仅本地存储'}
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">{d1Status.message}</p>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleSyncD1Push}
            disabled={isSyncingD1}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            {isSyncingD1 ? '⏳ 同步中...' : '⬆️ 手动同步设置到 D1'}
          </button>
          <button
            onClick={checkD1Connection}
            className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
          >
            🔄 重新检测状态
          </button>
        </div>
      </div>

      {/* Compute Engine & API Key Setup */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-2">
            🚀 融合算力引擎选择
          </h3>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-xl text-xs shadow-md hover:bg-blue-700 transition"
          >
            保存配置
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {COMPUTE_ENGINES.map((engine) => (
            <label
              key={engine.id}
              className={`flex items-start p-3 rounded-xl border cursor-pointer transition ${
                computeEngine === engine.id
                  ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 ring-1 ring-blue-500'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50'
              }`}
            >
              <input
                type="radio"
                name="computeEngine"
                value={engine.id}
                checked={computeEngine === engine.id}
                onChange={(e) => setComputeEngine(e.target.value)}
                className="mt-1 text-blue-600"
              />
              <div className="ml-2.5">
                <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                  {engine.name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {engine.description}
                </div>
              </div>
            </label>
          ))}
        </div>

        {/* API Keys Input */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">
            自定义算力 API Key 配置 (可选)
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                SiliconFlow Key
              </label>
              <input
                type="password"
                placeholder="sk-..."
                value={siliconApiKey}
                onChange={(e) => setSiliconApiKey(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                OpenAI API Key
              </label>
              <input
                type="password"
                placeholder="sk-..."
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Safety & Content Filter Switch */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <div className="text-xs font-black text-slate-800 dark:text-slate-100">
            🛡️ 敏感内容安全过滤开关 (NSFW Guard)
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            开启后默认自动屏蔽不宜画面及血腥敏感关键词
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={!enableNsfw}
            onChange={(e) => setEnableNsfw(!e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* System Mode Switch */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">{isDarkMode ? '🌙' : '☀️'}</span>
          <div>
            <div className="text-xs font-black text-slate-800 dark:text-slate-100">
              夜间模式 (Dark Mode)
            </div>
            <div className="text-[11px] text-slate-400">
              切换高对比度夜光深色视觉主题
            </div>
          </div>
        </div>

        <button
          onClick={toggleDarkMode}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
        >
          {isDarkMode ? '切换浅色' : '切换夜间'}
        </button>
      </div>
    </div>
  );
};
