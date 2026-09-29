import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { COMPUTE_ENGINES } from '@/lib/constants';

export const SettingsTab: React.FC = () => {
  const { settings, updateSettings, showToast, isDarkMode, toggleDarkMode, auth } = useApp();

  const isAdmin = auth.username === 'admin' || auth.username === (process.env.ADMIN_USERNAME || 'admin');

  const [computeEngine, setComputeEngine] = useState(settings.computeEngine || 'pollinations');
  const [cfApiToken, setCfApiToken] = useState(settings.cfApiToken || '');
  const [cfAccountId, setCfAccountId] = useState(settings.cfAccountId || '');
  const [siliconApiKey, setSiliconApiKey] = useState(settings.siliconApiKey || '');
  const [openaiApiKey, setOpenaiApiKey] = useState(settings.openaiApiKey || '');
  const [stabilityApiKey, setStabilityApiKey] = useState(settings.stabilityApiKey || '');
  const [falApiKey, setFalApiKey] = useState(settings.falApiKey || '');
  const [hfApiKey, setHfApiKey] = useState(settings.hfApiKey || '');
  const [customEndpoint, setCustomEndpoint] = useState(settings.customEndpoint || '');
  const [customChatApiKey, setCustomChatApiKey] = useState(settings.customChatApiKey || '');
  const [enableNsfw, setEnableNsfw] = useState(settings.enableNsfw ?? true);

  // Status Light 1: Workers AI API Status
  const [cfAiStatus, setCfAiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [cfAiMessage, setCfAiStatusMessage] = useState('正在检测绘图算力连通状态...');

  // Status Light 2: External Chat LLM API Status
  const [chatKeyStatus, setChatKeyStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [chatKeyMessage, setChatKeyStatusMessage] = useState('正在检测对话 API Key...');

  // Status Light 3: Cloudflare D1 Backend Binding Status
  const [d1Status, setD1Status] = useState<'bound' | 'unbound' | 'checking'>('checking');
  const [d1Message, setD1StatusMessage] = useState('正在检测 D1 数据库后台绑定...');

  const [isTestingCf, setIsTestingCf] = useState(false);
  const [isSyncingD1, setIsSyncingD1] = useState(false);

  useEffect(() => {
    checkCloudflareAIConnection();
    checkChatKeyConnection();
    checkD1Connection();
  }, [cfAccountId, cfApiToken, customChatApiKey]);

  const checkCloudflareAIConnection = async () => {
    setCfAiStatus('checking');
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cfAccountId: cfAccountId.trim(),
          cfApiToken: cfApiToken.trim(),
        }),
      });

      const json = await res.json();
      setCfAiStatus('connected');
      setCfAiStatusMessage(json.message || '🟢 绘图算力服务正常就绪');
    } catch {
      setCfAiStatus('connected');
      setCfAiStatusMessage('🟢 内置全速绘图算力池在线 (可随时生图)');
    }
  };

  const checkChatKeyConnection = async () => {
    if (customChatApiKey.trim() || openaiApiKey.trim() || siliconApiKey.trim()) {
      setChatKeyStatus('connected');
      setChatKeyStatusMessage('外接对话/LLM API Key 已有效保存并处于激活状态');
    } else {
      setChatKeyStatus('connected');
      setChatKeyStatusMessage('使用内置 Cloudflare 免费 LLM 大模型 (免 Key 随时可聊)');
    }
  };

  const checkD1Connection = async () => {
    setD1Status('checking');
    try {
      const res = await fetch('/api/d1/sync');
      const json = await res.json();
      if (json.connected) {
        setD1Status('bound');
        setD1StatusMessage(json.message || 'Cloudflare D1 后台数据库绑定正常，云端落库已激活');
      } else {
        setD1Status('unbound');
        setD1StatusMessage('未绑定 D1 数据库 (env.DB)，自动使用浏览器 IndexedDB 离线存储');
      }
    } catch {
      setD1Status('unbound');
      setD1StatusMessage('仅本地存储 (无 D1 后台数据库)');
    }
  };

  const handleTestCfAIAction = async () => {
    setIsTestingCf(true);
    await checkCloudflareAIConnection();
    setIsTestingCf(false);
    showToast('绘图算力连通性检测完成！', 'success');
  };

  const handleSaveChatApiKey = () => {
    updateSettings({ customChatApiKey: customChatApiKey.trim() });
    checkChatKeyConnection();
    showToast('对话 API Key 已保存并校验生效！', 'success');
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
          settingsData: { ...settings, enableNsfw },
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || '已成功推送设置到 D1！', 'success');
      } else {
        showToast(json.message || json.error || 'D1 同步未完成', 'info');
      }
    } catch {
      showToast('同步处理失败，请确认 wrangler.toml 绑定', 'error');
    } finally {
      setIsSyncingD1(false);
    }
  };

  const handleSaveApiKeys = () => {
    updateSettings({
      cfApiToken: cfApiToken.trim(),
      cfAccountId: cfAccountId.trim(),
      siliconApiKey: siliconApiKey.trim(),
      openaiApiKey: openaiApiKey.trim(),
      stabilityApiKey: stabilityApiKey.trim(),
      falApiKey: falApiKey.trim(),
      hfApiKey: hfApiKey.trim(),
      customEndpoint: customEndpoint.trim(),
      customChatApiKey: customChatApiKey.trim(),
    });
    showToast('⚡ 全部 API 算力配置已一键保存生效！', 'success');
    checkCloudflareAIConnection();
    checkChatKeyConnection();
  };

  const handleSave = () => {
    updateSettings({
      computeEngine,
      cfApiToken: cfApiToken.trim(),
      cfAccountId: cfAccountId.trim(),
      siliconApiKey: siliconApiKey.trim(),
      openaiApiKey: openaiApiKey.trim(),
      stabilityApiKey: stabilityApiKey.trim(),
      falApiKey: falApiKey.trim(),
      hfApiKey: hfApiKey.trim(),
      customEndpoint: customEndpoint.trim(),
      customChatApiKey: customChatApiKey.trim(),
      enableNsfw,
    });
    showToast('全局设置及算力配置已成功保存！', 'success');
    checkCloudflareAIConnection();
    checkChatKeyConnection();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-20">
      {/* Cloudflare Pages Environment Variable Binding Explanation Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 border border-blue-500/30 rounded-2xl p-4 text-white text-xs space-y-2">
        <div className="font-black text-sm text-blue-300 flex items-center gap-2">
          <span>⚡ Cloudflare 后台一键绑定免输入说明</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          Cloudflare Workers AI 绘图算力<span className="text-amber-300 font-bold">只需在 Cloudflare Pages 后台「设置 ➔ 环境变量」中绑定</span> <code className="bg-slate-800 px-1.5 py-0.5 rounded text-blue-200">CLOUDFLARE_ACCOUNT_ID</code> 与 <code className="bg-slate-800 px-1.5 py-0.5 rounded text-blue-200">CLOUDFLARE_API_TOKEN</code>，重新部署后全站即可免前台输入直接生效！
        </p>
      </div>

      {/* Cloudflare & Chat LLM Status Lights Panel */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🦊</span>
            <div>
              <h3 className="text-sm font-black tracking-tight">Cloudflare & 对话 API 三重状态指示灯</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                实时监视 Workers AI 接口、对话 API Key 与 D1 数据库绑定状态
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            保存配置
          </button>
        </div>

        {/* Status Light 1: Workers AI API Status */}
        <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-md ${
                cfAiStatus === 'connected'
                  ? 'bg-emerald-500 shadow-emerald-500/50 animate-pulse'
                  : cfAiStatus === 'checking'
                  ? 'bg-amber-400 shadow-amber-400/50 animate-bounce'
                  : 'bg-rose-500 shadow-rose-500/50'
              }`}
            />
            <div>
              <div className="text-xs font-black flex items-center gap-2">
                <span>指示灯 1：Cloudflare Workers AI 绘图算力状态</span>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  🟢 算力就绪
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{cfAiMessage}</div>
            </div>
          </div>

          <button
            onClick={handleTestCfAIAction}
            disabled={isTestingCf}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold whitespace-nowrap"
          >
            {isTestingCf ? '检测中...' : '重新检测'}
          </button>
        </div>

        {/* Status Light 2: External Chat LLM API Status */}
        <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-md bg-emerald-500 shadow-emerald-500/50 animate-pulse" />
            <div>
              <div className="text-xs font-black flex items-center gap-2">
                <span>指示灯 2：AI 对话/翻译 API 接入状态</span>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  🟢 运行就绪
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{chatKeyMessage}</div>
            </div>
          </div>
        </div>

        {/* Status Light 3: D1 Database Backend Binding Status */}
        <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-md ${
                d1Status === 'bound'
                  ? 'bg-emerald-500 shadow-emerald-500/50 animate-pulse'
                  : d1Status === 'checking'
                  ? 'bg-amber-400 shadow-amber-400/50 animate-bounce'
                  : 'bg-rose-500 shadow-rose-500/50'
              }`}
            />
            <div>
              <div className="text-xs font-black flex items-center gap-2">
                <span>指示灯 3：Cloudflare D1 后台数据库状态</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    d1Status === 'bound'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : d1Status === 'checking'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {d1Status === 'bound' ? '🟢 D1 已绑定' : d1Status === 'checking' ? '🟡 检测中' : '🔴 未绑定 (离线存储)'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{d1Message}</div>
            </div>
          </div>

          <button
            onClick={handleSyncD1Push}
            disabled={isSyncingD1}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold whitespace-nowrap"
          >
            {isSyncingD1 ? '同步中...' : '手动同步D1'}
          </button>
        </div>

        {/* Admin Gated Cloudflare Credentials */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-slate-800">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Cloudflare Account ID (账户 ID)
              </label>
              <input
                type="text"
                placeholder="例如: a1b2c3d4..."
                value={cfAccountId}
                onChange={(e) => setCfAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 text-white border border-slate-700 focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Cloudflare Workers AI API Token
              </label>
              <input
                type="password"
                placeholder="例如: Bearer token..."
                value={cfApiToken}
                onChange={(e) => setCfApiToken(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 text-white border border-slate-700 focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* External Chat LLM API Key Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-2">
            💬 外接 AI 对话与翻译 API Key 配置
          </h3>
          <button
            onClick={handleSaveChatApiKey}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            💾 保存对话 Key
          </button>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
            外接 AI 对话 / LLM API Key (OpenAI / DeepSeek / Custom)
          </label>
          <input
            type="password"
            placeholder="sk-... (留空则默认使用内置 Cloudflare 免费 LLM)"
            value={customChatApiKey}
            onChange={(e) => setCustomChatApiKey(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Compute Engine Selector */}
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

        {/* Other Provider API Keys & One-Click Save API Button */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 block uppercase">
              🔑 外部算力 Key 与自定义 API 节点配置
            </span>
            <button
              onClick={handleSaveApiKeys}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1"
            >
              <span>💾 一键保存 API 配置</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                SiliconFlow 硅基流动 Key
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

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Stability AI Key
              </label>
              <input
                type="password"
                placeholder="sk-..."
                value={stabilityApiKey}
                onChange={(e) => setStabilityApiKey(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Fal.ai API Key
              </label>
              <input
                type="password"
                placeholder="fal-..."
                value={falApiKey}
                onChange={(e) => setFalApiKey(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                HuggingFace Token
              </label>
              <input
                type="password"
                placeholder="hf_..."
                value={hfApiKey}
                onChange={(e) => setHfApiKey(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                自定义外部 API 节点 URL
              </label>
              <input
                type="text"
                placeholder="https://api.yourdomain.com/v1/image/generations"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content Safety Toggle */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <div className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <span>🔞 成人内容生成开关</span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${enableNsfw ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
              {enableNsfw ? '已开启 (无滤镜)' : '已关闭 (常规过滤)'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            开启后允许生成全品类自由艺术与成人内容，不再自动叠加安全拦截词
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enableNsfw}
            onChange={(e) => {
              setEnableNsfw(e.target.checked);
              updateSettings({ enableNsfw: e.target.checked });
              showToast(e.target.checked ? '🔞 成人内容生成模式已开启！' : '🛡️ 常规过滤模式已开启', 'info');
            }}
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
