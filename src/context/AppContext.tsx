'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSettings, AuthState, AIModel, GeneratedImage, PromptDraft } from '@/types';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredAuthToken,
  setStoredAuthToken,
  getStoredUsername,
  setStoredUsername,
  getFavoriteModels,
  toggleFavoriteModel as toggleFavStorage,
  getHistoryItems,
  saveHistoryItem,
  deleteHistoryItem as deleteHistStorage,
  clearAllHistory as clearHistStorage,
  getStoredDrafts,
  saveStoredDraft,
  deleteStoredDraft,
} from '@/lib/storage';
import { PRESET_MODELS, DEFAULT_SETTINGS } from '@/lib/constants';
import { StylePreset, STYLE_PRESETS } from '@/lib/stylePresets';
import { LoraPreset, LORA_PRESETS } from '@/lib/loraPresets';

interface AppContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  auth: AuthState;
  login: (token: string, username: string) => void;
  logout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  models: AIModel[];
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;
  toggleFavoriteModel: (modelId: string) => void;

  currentPrompt: string;
  setCurrentPrompt: (prompt: string) => void;
  negativePrompt: string;
  setNegativePrompt: (negativePrompt: string) => void;

  selectedStyle: StylePreset;
  setSelectedStyle: (style: StylePreset) => void;
  selectedLora: LoraPreset;
  setSelectedLora: (lora: LoraPreset) => void;

  styleStrength: number;
  setStyleStrength: (val: number) => void;
  loraWeight: number;
  setLoraWeight: (val: number) => void;

  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;
  steps: number;
  setSteps: (steps: number) => void;
  guidance: number;
  setGuidance: (guidance: number) => void;
  batchCount: number;
  setBatchCount: (count: number) => void;

  history: GeneratedImage[];
  isGenerating: boolean;
  lastGeneratedImage: GeneratedImage | null;
  generateImage: (type: 'text-to-image' | 'image-to-image' | 'edit-image', extraParams?: any) => Promise<void>;
  deleteHistoryItem: (id: string) => void;
  clearHistory: () => void;

  drafts: PromptDraft[];
  saveCurrentAsDraft: (title?: string) => void;
  loadDraft: (draft: PromptDraft) => void;
  deleteDraft: (draftId: string) => void;

  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [auth, setAuth] = useState<AuthState>({ isLoggedIn: false, username: null, token: null });
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [models, setModels] = useState<AIModel[]>(PRESET_MODELS);
  const [selectedModel, setSelectedModel] = useState<AIModel>(PRESET_MODELS[0]);

  const [currentPrompt, setCurrentPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState(DEFAULT_SETTINGS.defaultNegativePrompt);

  const [selectedStyle, setSelectedStyle] = useState<StylePreset>(STYLE_PRESETS[0]);
  const [selectedLora, setSelectedLora] = useState<LoraPreset>(LORA_PRESETS[0]);
  const [styleStrength, setStyleStrength] = useState(0.65);
  const [loraWeight, setLoraWeight] = useState(0.5);

  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [steps, setSteps] = useState(25);
  const [guidance, setGuidance] = useState(8.0);
  const [batchCount, setBatchCount] = useState(1);

  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedImage, setLastGeneratedImage] = useState<GeneratedImage | null>(null);

  const [drafts, setDrafts] = useState<PromptDraft[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    const loadedSettings = getStoredSettings();
    setSettings(loadedSettings);
    setIsDarkMode(loadedSettings.darkMode);

    if (loadedSettings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const token = getStoredAuthToken();
    const username = getStoredUsername();
    if (token) {
      setAuth({ isLoggedIn: true, username, token });
    }

    const favs = getFavoriteModels();
    setModels((prev) =>
      prev.map((m) => ({
        ...m,
        isFavorite: favs.includes(m.id),
      }))
    );

    getHistoryItems().then(setHistory);
    setDrafts(getStoredDrafts());
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveStoredSettings(updated);
    if (newSettings.darkMode !== undefined) {
      setIsDarkMode(newSettings.darkMode);
      if (newSettings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    updateSettings({ darkMode: nextMode });
  };

  const login = (token: string, username: string) => {
    setStoredAuthToken(token);
    setStoredUsername(username);
    setAuth({ isLoggedIn: true, username, token });
    showToast(`欢迎回来，${username}`, 'success');
  };

  const logout = () => {
    setStoredAuthToken(null);
    setStoredUsername(null);
    setAuth({ isLoggedIn: false, username: null, token: null });
    showToast('已安全退出登录', 'info');
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

  const generateImage = async (type: 'text-to-image' | 'image-to-image' | 'edit-image', extraParams?: any) => {
    if (!currentPrompt.trim()) {
      showToast('请输入有效的正向提示词', 'error');
      return;
    }

    setIsGenerating(true);
    const endpoint = `/api/generate/${type}`;

    let combinedPrompt = currentPrompt;
    if (selectedStyle && selectedStyle.promptBoost) {
      combinedPrompt = `${combinedPrompt}, ${selectedStyle.promptBoost}`;
    }
    if (selectedLora && selectedLora.triggerWords) {
      combinedPrompt = `${combinedPrompt}, ${selectedLora.triggerWords}`;
    }

    let combinedNegative = negativePrompt;
    if (selectedStyle && selectedStyle.negativeBoost) {
      combinedNegative = `${combinedNegative}, ${selectedStyle.negativeBoost}`;
    }

    const payload = {
      prompt: combinedPrompt,
      negativePrompt: combinedNegative,
      model: selectedModel.id,
      provider: selectedModel.provider,
      computeEngine: settings.computeEngine,
      styleStrength,
      steps,
      guidance,
      batchCount,
      aspectRatio,
      siliconApiKey: settings.siliconApiKey,
      openaiApiKey: settings.openaiApiKey,
      stabilityApiKey: settings.stabilityApiKey,
      cfApiToken: settings.cfApiToken,
      cfAccountId: settings.cfAccountId,
      ...extraParams,
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (json.success && json.data) {
        const primaryUrl = json.data.imageUrl || (json.data.imageUrls && json.data.imageUrls[0]);
        const newImage: GeneratedImage = {
          id: `img_${Date.now()}`,
          imageUrl: primaryUrl,
          imageUrls: json.data.imageUrls || [primaryUrl],
          params: {
            prompt: currentPrompt,
            negativePrompt,
            width: 1024,
            height: 1024,
            aspectRatio,
            model: selectedModel.name,
            steps,
            guidance,
            batchCount,
          },
          createdAt: Date.now(),
          modelName: selectedModel.name,
          generationTimeMs: json.data.generationTimeMs || 1200,
        };

        setLastGeneratedImage(newImage);
        await saveHistoryItem(newImage);
        const updatedHistory = await getHistoryItems();
        setHistory(updatedHistory);
        showToast('画面生成成功！', 'success');
      } else {
        showToast(json.error || '生成失败，请检查参数或网络', 'error');
      }
    } catch (e: any) {
      showToast('调用 API 发生异常，请重试', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    await deleteHistStorage(id);
    const updated = await getHistoryItems();
    setHistory(updated);
    showToast('已删除此记录', 'info');
  };

  const clearHistory = async () => {
    await clearHistStorage();
    setHistory([]);
    showToast('所有历史记录已清空', 'info');
  };

  const saveCurrentAsDraft = (title?: string) => {
    const draft: PromptDraft = {
      id: `draft_${Date.now()}`,
      title: title || currentPrompt.slice(0, 15) || '未命名草稿',
      prompt: currentPrompt,
      negativePrompt,
      modelId: selectedModel.id,
      stylePreset: selectedStyle.id,
      loraId: selectedLora.id,
      styleStrength,
      loraWeight,
      steps,
      guidance,
      createdAt: Date.now(),
    };

    const updated = saveStoredDraft(draft);
    setDrafts(updated);
    showToast('草稿已保存！', 'success');
  };

  const loadDraft = (draft: PromptDraft) => {
    setCurrentPrompt(draft.prompt);
    setNegativePrompt(draft.negativePrompt);
    const foundModel = models.find((m) => m.id === draft.modelId);
    if (foundModel) setSelectedModel(foundModel);

    const foundStyle = STYLE_PRESETS.find((s) => s.id === draft.stylePreset);
    if (foundStyle) setSelectedStyle(foundStyle);

    setStyleStrength(draft.styleStrength);
    setSteps(draft.steps);
    setGuidance(draft.guidance);
    showToast('草稿加载成功', 'info');
  };

  const deleteDraft = (draftId: string) => {
    const updated = deleteStoredDraft(draftId);
    setDrafts(updated);
    showToast('草稿已删除', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        auth,
        login,
        logout,
        isDarkMode,
        toggleDarkMode,
        models,
        selectedModel,
        setSelectedModel,
        toggleFavoriteModel,
        currentPrompt,
        setCurrentPrompt,
        negativePrompt,
        setNegativePrompt,
        selectedStyle,
        setSelectedStyle,
        selectedLora,
        setSelectedLora,
        styleStrength,
        setStyleStrength,
        loraWeight,
        setLoraWeight,
        aspectRatio,
        setAspectRatio,
        steps,
        setSteps,
        guidance,
        setGuidance,
        batchCount,
        setBatchCount,
        history,
        isGenerating,
        lastGeneratedImage,
        generateImage,
        deleteHistoryItem,
        clearHistory,
        drafts,
        saveCurrentAsDraft,
        loadDraft,
        deleteDraft,
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
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
