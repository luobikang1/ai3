'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { getStoredLoginBg, setStoredLoginBg, saveUserCreds, getStoredUserCreds } from '@/lib/storage';
import { User, KeyRound, AlertCircle, Sparkles, UserPlus, LogIn, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';

export const LoginGateScreen: React.FC = () => {
  const { login } = useApp();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [customBg, setCustomBg] = useState<string | null>(null);

  const bgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedBg = getStoredLoginBg();
    if (savedBg) {
      setCustomBg(savedBg);
    }
  }, []);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('请选择格式正确的背景图片文件');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('背景图片文件大小不能超过 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const url = event.target.result as string;
        setCustomBg(url);
        setStoredLoginBg(url);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBg = () => {
    setCustomBg(null);
    setStoredLoginBg(null);
    if (bgInputRef.current) bgInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('请填写完整的用户名和密码');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const cleanUser = username.trim();
      const cleanPass = password.trim();

      // Check local stored credentials if registered offline
      const localCreds = getStoredUserCreds();
      if (isRegisterMode) {
        saveUserCreds(cleanUser, cleanPass);
      } else if (localCreds[cleanUser] && localCreds[cleanUser] !== cleanPass) {
        setErrorMsg('密码不匹配，请重新输入');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUser,
          password: cleanPass,
          action: isRegisterMode ? 'register' : 'login',
        }),
      });
      const data = await res.json();

      if (data.success && data.data?.token) {
        saveUserCreds(cleanUser, cleanPass);
        login(data.data.token, data.data.username);
      } else {
        setErrorMsg(data.error || '凭证校验失败，请核对后重试');
      }
    } catch (err: any) {
      setErrorMsg(err.message || '网络连接异常，无法连接到认证服务器');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white">
      {/* Custom Background Image Overlay */}
      {customBg ? (
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={customBg}
            alt="Custom Background"
            className="w-full h-full object-cover scale-105 filter brightness-50 blur-[2px] transition-all duration-700"
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.15)_0,transparent_70%)]" />
      )}

      {/* Hidden File Input for Custom Login BG */}
      <input
        type="file"
        ref={bgInputRef}
        onChange={handleBgUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Background Action Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
        <button
          onClick={() => bgInputRef.current?.click()}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full text-xs font-medium backdrop-blur-md border border-white/20 transition-all shadow-lg"
          title="上传自定义登录背景"
        >
          <Upload size={14} className="text-orange-400" />
          <span>{customBg ? '更换壁纸' : '自定义壁纸'}</span>
        </button>

        {customBg && (
          <button
            onClick={handleRemoveBg}
            className="p-1.5 bg-red-600/80 hover:bg-red-700 text-white rounded-full text-xs transition-colors backdrop-blur-md shadow-lg"
            title="移除自定义壁纸"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Main Login/Register Card */}
      <div className="relative z-10 w-full max-w-md p-6 sm:p-8 bg-gray-900/80 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-red-500 mx-auto flex items-center justify-center text-3xl font-extrabold shadow-xl shadow-orange-500/20">
            狐
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white pt-2">
            白狐AI三
          </h1>
          <p className="text-xs text-gray-300 font-medium">
            {isRegisterMode
              ? '创建新账号，凭证加密保存在浏览器，免数据库极速体验'
              : '输入管理员凭证或自定义免数据库账号通行'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/70 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-start space-x-2 shadow-inner">
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
                placeholder="管理员 admin 或注册新账号"
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
                placeholder="预设管理员密码或自定义 4 位以上密码"
                className="w-full pl-10 pr-3 py-2.5 bg-gray-800/80 border border-gray-700/80 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[46px]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-orange-500/25 active:scale-[0.98] disabled:opacity-50 min-h-[48px] flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>验证登录中...</span>
              </>
            ) : isRegisterMode ? (
              <>
                <UserPlus size={18} />
                <span>立即注册并登录</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>通行并进入系统</span>
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
            className="text-xs text-orange-400 hover:text-orange-300 transition-colors inline-flex items-center space-x-1 font-medium"
          >
            <Sparkles size={13} />
            <span>
              {isRegisterMode
                ? '已有账号？点击直接登录'
                : '没有账号？点击注册免数据库新账号'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
