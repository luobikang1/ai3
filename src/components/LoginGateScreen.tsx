'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Lock, User, KeyRound, AlertCircle, Sparkles, UserPlus, LogIn } from 'lucide-react';

export const LoginGateScreen: React.FC = () => {
  const { login } = useApp();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('请填写完整的用户名和密码');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          action: isRegisterMode ? 'register' : 'login',
        }),
      });
      const data = await res.json();

      if (data.success && data.data?.token) {
        login(data.data.token, data.data.username);
      } else {
        setErrorMsg(data.error || '验证失败，请重新输入');
      }
    } catch (err: any) {
      setErrorMsg(err.message || '网络连接异常，无法连接到认证服务器');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white">
      <div className="w-full max-w-md p-6 sm:p-8 bg-gray-900/90 border border-gray-800 rounded-3xl shadow-2xl backdrop-blur-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-red-500 mx-auto flex items-center justify-center text-3xl font-extrabold shadow-lg shadow-orange-500/20">
            狐
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white pt-2">
            白狐AI三
          </h1>
          <p className="text-xs text-gray-400">
            {isRegisterMode
              ? '免费快速注册新账号，无需数据库即可登录体验 AI 绘图'
              : '输入管理员或免数据库通行凭证，解锁智能 AI 绘图系统'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-start space-x-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              用户名
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="部署预设 admin 或自定义用户名"
                className="w-full pl-10 pr-3 py-2.5 bg-gray-800/80 border border-gray-700/80 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[46px]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              密码
            </label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="部署预设密码或自定义 4 位以上密码"
                className="w-full pl-10 pr-3 py-2.5 bg-gray-800/80 border border-gray-700/80 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[46px]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] disabled:opacity-50 min-h-[48px] flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>验证登录中...</span>
              </>
            ) : isRegisterMode ? (
              <>
                <UserPlus size={18} />
                <span>快速注册并登录界面</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>验证并进入白狐AI三</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-gray-800 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setErrorMsg('');
            }}
            className="text-xs text-orange-400 hover:text-orange-300 transition-colors inline-flex items-center space-x-1"
          >
            <Sparkles size={13} />
            <span>
              {isRegisterMode
                ? '已有凭证？直接进行登录'
                : '没有账号？无数据库免注册快速通行'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
