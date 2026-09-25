import React from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info' }) => {
  const bgColor =
    type === 'success'
      ? 'bg-emerald-600'
      : type === 'error'
      ? 'bg-rose-600'
      : 'bg-blue-600';

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
      <div className={`${bgColor} text-white px-4 py-2 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border border-white/20`}>
        <span>{type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
        <span>{message}</span>
      </div>
    </div>
  );
};
