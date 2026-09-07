'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSettings, AuthState, AIModel, GeneratedImage } from '@/types';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredAuthToken,
  setStoredAuthToken,
  getStoredUsername,
  getFavoriteModels,
  toggleFavoriteModel as toggleFavStorage,
  getHistoryItems,
  saveHistoryItem,
  deleteHistoryItem as deleteHistStorage,
  clearAllHistory as clearHistStorage,
} from '@/lib/storage';
import { PRESET_MODELS } from '@/lib/constants';

interface AppContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  auth: AuthState;
  login: (token: string, username: string) => void;
  logout: () => void;
  models: AIModel[];
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;
  toggleFavoriteModel: (modelId: string) => void;
  translateModels: () => Promise<void>;
  isTranslating: boolean;
  history: GeneratedImage[];
  addHistoryItem: (item: GeneratedImage) => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(getStoredSettings());
  const [auth, setAuth] = useState<AuthState>({
    isLoggedIn: false,
    username: null,
    token: null,
  });
  const [models, setModels] = useState<AIModel[]>(PRESET_MODELS);
  const [selectedModel, setSelectedModel] = useState<AIModel>(PRESET_MODELS[0]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Initialize on mount
  useEffect(() => {
    // 1. Settings
    const initialSettings = getStoredSettings();
    setSettings(initialSettings);
    if (initialSettings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 2. Auth
    const token = getStoredAuthToken();
    const username = getStoredUsername();
    if (token && username) {
      setAuth({ isLoggedIn: true, username, token });
    }

    // 3. Favorites
    const favs = getFavoriteModels();
    setModels((prev) =>
      prev.map((m) => ({
        ...m,
        isFavorite: favs.includes(m.id),
      }))
    );

    // 4. Find saved default model
    const defaultM = PRESET_MODELS.find((m) => m.id === initialSettings.defaultModel);
    if (defaultM) {
      setSelectedModel(defaultM);
    }

    // 5. Load History from IndexedDB
    getHistoryItems().then((items) => {
      setHistory(items);
    });
  }, []);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updated = saveStoredSettings(newSettings);
    setSettings(updated);
    if (updated.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const login = (token: string, username: string) => {
    setStoredAuthToken(token, username);
    setAuth({ isLoggedIn: true, username, token });
    showToast('登录成功', 'success');
  };

  const logout = () => {
    setStoredAuthToken(null);
    setAuth({ isLoggedIn: false, username: null, token: null });
    showToast('已退出登录', 'info');
  };

  const toggleFavoriteModel = (modelId: string) => {
    const updatedFavs = toggleFavStorage(modelId);
    setModels((prev) =>
      prev.map((m) => ({
        ...m,
        isFavorite: updatedFavs.includes(m.id),
      }))
    );
  };

  const translateModels = async () => {
    setIsTranslating(true);
    showToast('正在翻译模型名称...', 'info');
    try {
      const translatedList = await Promise.all(
        models.map(async (model) => {
          if (model.translatedName && model.translatedName !== model.name) {
            return model;
          }
          try {
            const res = await fetch('/api/models/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: model.name }),
            });
            const json = await res.json();
            if (json.success && json.data?.translatedText) {
              return { ...model, translatedName: json.data.translatedText };
            }
          } catch (e) {
            console.warn(`Translation failed for model: ${model.name}`, e);
          }
          return model;
        })
      );
      setModels(translatedList);
      showToast('模型中文名称翻译完成', 'success');
    } catch (e) {
      showToast('模型翻译出现故障，已保留原始英文名称', 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  const addHistoryItem = async (item: GeneratedImage) => {
    await saveHistoryItem(item);
    setHistory((prev) => [item, ...prev]);
  };

  const deleteHistoryItem = async (id: string) => {
    await deleteHistStorage(id);
    setHistory((prev) => prev.filter((i) => i.id !== id));
    showToast('已删除历史记录', 'success');
  };

  const clearHistory = async () => {
    await clearHistStorage();
    setHistory([]);
    showToast('已清空所有历史记录', 'success');
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        auth,
        login,
        logout,
        models,
        selectedModel,
        setSelectedModel,
        toggleFavoriteModel,
        translateModels,
        isTranslating,
        history,
        addHistoryItem,
        deleteHistoryItem,
        clearHistory,
        toast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
