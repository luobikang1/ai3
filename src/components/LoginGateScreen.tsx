import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';

export const LoginGateScreen: React.FC = () => {
  const { login, showToast } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('请输入用户名和密码', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        login(json.data.token, json.data.username);
      } else {
        showToast(json.error || '登录失败，请检查账号密码', 'error');
      }
    } catch {
      showToast('登录服务异常，请重试', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-blue-500/30">
            🦊
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-400 to-sky-300 bg-clip-text text-transparent">
            白狐AI三
          </h1>
          <p className="text-xs text-slate-400">
            简洁、移动端友好、零数据库依赖的 AI 绘图工作台
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              账号 (Admin 或 任意访客用户名)
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="例如: admin"
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              访问密码 (管理员初始密码: admin888)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="管理员默认密码 admin888"
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm rounded-xl shadow-lg transition"
          >
            {isLoading ? '🔐 验证加密令牌中...' : '🚀 登录进入 白狐AI三'}
          </button>
        </form>

        <div className="p-3 bg-blue-950/40 border border-blue-900/50 rounded-xl text-[11px] text-blue-200/80 space-y-1">
          <p className="font-bold text-blue-300">💡 提示：</p>
          <p>管理员账号为 <code className="text-blue-200">admin</code>，初始密码为 <code className="text-blue-200">admin888</code>。可在部署环境变量中自定义 <code className="text-blue-200">ADMIN_PASSWORD</code>。</p>
        </div>
      </div>
    </div>
  );
};
