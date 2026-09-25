'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Lock, User, KeyRound, Sparkles, ShieldCheck } from 'lucide-react';

export const LoginGateScreen: React.FC = () => {
  const { login, showToast } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('请输入用户名与密码', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await res.json();
      if (data.success && data.data?.token) {
        login(data.data.token, data.data.username);
      } else {
        showToast(data.error || '登录鉴权失败，请核对凭证', 'error');
      }
    } catch {
      showToast('无法连接鉴权服务器', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow Elements */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white/10 dark:bg-gray-900/60 backdrop-blur-2xl border border-white/20 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10 text-white">
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 mx-auto flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-500/30">
            狐
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
            白狐AI三
          </h1>
          <p className="text-xs text-blue-200/80">
            新一代极速 AI 图像绘制与大模型融合平台
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-blue-200">
              管理员账号 (Username)
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-3.5 text-blue-300/70" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="例如: admin"
                className="w-full pl-10 pr-4 py-3 bg-white/10 dark:bg-gray-800/60 border border-white/15 dark:border-gray-700/60 rounded-xl text-sm placeholder-blue-200/40 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-blue-200">
              登录密码 (Password)
            </label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3.5 top-3.5 text-blue-300/70" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码 (默认: foxai123)"
                className="w-full pl-10 pr-4 py-3 bg-white/10 dark:bg-gray-800/60 border border-white/15 dark:border-gray-700/60 rounded-xl text-sm placeholder-blue-200/40 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 hover:from-blue-700 hover:to-indigo-700 font-bold rounded-xl text-sm shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] disabled:opacity-50 min-h-[48px] flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>进入白狐AI三工作台</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center text-[10px] text-blue-200/50 pt-2 border-t border-white/10">
          受 JWT 安全 Token 保护 · 出厂默认密码: <code className="text-blue-300 font-bold">foxai123</code>
        </div>
      </div>
    </div>
  );
};
