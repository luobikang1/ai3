import { GeneratedImage, UserSettings, PromptDraft } from '@/types';
import { DEFAULT_SETTINGS } from './constants';

const DB_NAME = 'FoxAI3StorageDB';
const DB_VERSION = 1;
const HISTORY_STORE = 'image_history';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        const store = db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Canvas-based WebP compression for optimized storage footprint
export async function compressImageToWebP(base64Url: string, quality = 0.82): Promise<string> {
  if (typeof window === 'undefined' || !base64Url || !base64Url.startsWith('data:image')) {
    return base64Url;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Url);
        return;
      }
      ctx.drawImage(img, 0, 0);
      try {
        const webpData = canvas.toDataURL('image/webp', quality);
        resolve(webpData.length < base64Url.length ? webpData : base64Url);
      } catch (e) {
        resolve(base64Url);
      }
    };
    img.onerror = () => resolve(base64Url);
    img.src = base64Url;
  });
}

export const getStoredHistory = async (): Promise<GeneratedImage[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(HISTORY_STORE, 'readonly');
      const store = tx.objectStore(HISTORY_STORE);
      const index = store.index('createdAt');
      const request = index.openCursor(null, 'prev');
      const items: GeneratedImage[] = [];

      request.onsuccess = (e: any) => {
        const cursor = e.target.result;
        if (cursor) {
          items.push(cursor.value);
          cursor.continue();
        } else {
          resolve(items);
        }
      };
      request.onerror = () => {
        const raw = localStorage.getItem('fox_ai_3_history');
        resolve(raw ? JSON.parse(raw) : []);
      };
    });
  } catch (e) {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('fox_ai_3_history') : null;
    return raw ? JSON.parse(raw) : [];
  }
};

export const getHistoryItems = getStoredHistory;

export const saveHistoryItem = async (item: GeneratedImage): Promise<void> => {
  try {
    const compressedUrl = await compressImageToWebP(item.imageUrl);
    const optimizedItem: GeneratedImage = {
      ...item,
      imageUrl: compressedUrl,
    };

    const db = await openDB();
    const tx = db.transaction(HISTORY_STORE, 'readwrite');
    const store = tx.objectStore(HISTORY_STORE);
    store.put(optimizedItem);
  } catch (e) {
    const current = await getStoredHistory();
    const updated = [item, ...current].slice(0, 30);
    localStorage.setItem('fox_ai_3_history', JSON.stringify(updated));
  }
};

export const deleteStoredHistoryItem = async (id: string): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(HISTORY_STORE, 'readwrite');
    const store = tx.objectStore(HISTORY_STORE);
    store.delete(id);
  } catch (e) {
    const current = await getStoredHistory();
    const updated = current.filter((x) => x.id !== id);
    localStorage.setItem('fox_ai_3_history', JSON.stringify(updated));
  }
};

export const deleteHistoryItem = deleteStoredHistoryItem;

export const clearAllHistory = async (): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(HISTORY_STORE, 'readwrite');
    const store = tx.objectStore(HISTORY_STORE);
    store.clear();
  } catch (e) {
    localStorage.removeItem('fox_ai_3_history');
  }
};

export const getStoredSettings = (): UserSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const raw = localStorage.getItem('fox_ai_3_settings');
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveStoredSettings = (settings: UserSettings): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('fox_ai_3_settings', JSON.stringify(settings));
};

export const getStoredAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('fox_ai_3_auth_token');
};

export const setStoredAuthToken = (token: string | null): void => {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('fox_ai_3_auth_token', token);
  } else {
    localStorage.removeItem('fox_ai_3_auth_token');
  }
};

export const getStoredUsername = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('fox_ai_3_username');
};

export const setStoredUsername = (username: string | null): void => {
  if (typeof window === 'undefined') return;
  if (username) {
    localStorage.setItem('fox_ai_3_username', username);
  } else {
    localStorage.removeItem('fox_ai_3_username');
  }
};

export const getFavoriteModels = (): string[] => {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem('fox_ai_3_favorites');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const toggleFavoriteModel = (modelId: string): string[] => {
  if (typeof window === 'undefined') return [];
  const favorites = getFavoriteModels();
  const exists = favorites.includes(modelId);
  const updated = exists ? favorites.filter((id) => id !== modelId) : [...favorites, modelId];
  localStorage.setItem('fox_ai_3_favorites', JSON.stringify(updated));
  return updated;
};

export const getStoredDrafts = (): PromptDraft[] => {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem('fox_ai_3_drafts');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveStoredDraft = (draft: PromptDraft): PromptDraft[] => {
  if (typeof window === 'undefined') return [];
  const current = getStoredDrafts();
  const filtered = current.filter((d) => d.id !== draft.id);
  const updated = [draft, ...filtered];
  localStorage.setItem('fox_ai_3_drafts', JSON.stringify(updated));
  return updated;
};

export const deleteStoredDraft = (draftId: string): PromptDraft[] => {
  if (typeof window === 'undefined') return [];
  const current = getStoredDrafts();
  const updated = current.filter((d) => d.id !== draftId);
  localStorage.setItem('fox_ai_3_drafts', JSON.stringify(updated));
  return updated;
};
