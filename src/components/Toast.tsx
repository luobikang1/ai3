'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />,
    error: <AlertCircle size={16} className="text-red-500 shrink-0" />,
    info: <Info size={16} className="text-blue-500 shrink-0" />,
  };

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-xs w-[90%]">
      <div className="bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-md text-white px-4 py-2.5 rounded-full shadow-lg border border-gray-700/50 flex items-center space-x-2 text-xs font-medium">
        {icons[toast.type]}
        <span className="truncate">{toast.message}</span>
      </div>
    </div>
  );
};
