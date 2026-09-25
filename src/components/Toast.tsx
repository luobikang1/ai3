'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />,
    error: <AlertCircle size={16} className="text-rose-500 shrink-0" />,
    info: <Info size={16} className="text-blue-500 shrink-0" />,
  };

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce-short max-w-sm w-auto">
      <div className="flex items-center space-x-2 px-4 py-2.5 bg-gray-900/90 dark:bg-gray-100/90 text-white dark:text-gray-900 rounded-full text-xs font-medium shadow-xl backdrop-blur-md border border-white/10 dark:border-black/10">
        {icons[toast.type]}
        <span>{toast.message}</span>
      </div>
    </div>
  );
};
