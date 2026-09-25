import { GeneratedImage, UserSettings, PromptDraft } from '@/types';
import { DEFAULT_SETTINGS } from './constants';

const SETTINGS_KEY = 'fox_ai_settings';
const WORKSTATION_STATE_KEY = 'fox_ai_workstation_state';
const DRAFTS_KEY = 'fox_ai_drafts';
const AUTH_TOKEN_KEY = 'fox_ai_auth_token';
const AUTH_USER_KEY = 'fox_ai_auth_user';
const LOGIN_BG_KEY = 'fox_ai_login_bg';
const USER_CREDS_KEY = 'fox_ai_user_creds';
const FAVORITE_MODELS_KEY = 'fox_ai_fav_models';
const DB_NAME = 'FoxAI_DB';
const STORE_NAME = 'history';

// LocalStorage helpers for settings
export function getStoredSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to parse stored settings', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: Partial<UserSettings>): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const current = getStoredSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
  return updated;
}

// Workstation Prompt & Spec State Persistence (Prevent Refresh Loss)
export interface StoredWorkstationState {
  prompt: string;
  negativePrompt: string;
  selectedStyle: string;
  selectedLora: string;
  styleStrength: number;
  loraWeight: number;
  sampler: string;
  aspectRatio: string;
  batchCount: number;
  steps: number;
  guidance: number;
}

export function getStoredWorkstationState(): StoredWorkstationState {
  const fallback: StoredWorkstationState = {
    prompt: '',
    negativePrompt: DEFAULT_SETTINGS.defaultNegativePrompt,
    selectedStyle: 'none',
    selectedLora: 'none',
    styleStrength: DEFAULT_SETTINGS.defaultStyleStrength,
    loraWeight: DEFAULT_SETTINGS.defaultLoraWeight,
    sampler: DEFAULT_SETTINGS.defaultSampler,
    aspectRatio: DEFAULT_SETTINGS.defaultAspectRatio,
    batchCount: DEFAULT_SETTINGS.defaultBatchCount,
    steps: DEFAULT_SETTINGS.defaultSteps,
    guidance: DEFAULT_SETTINGS.defaultGuidance,
  };

  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(WORKSTATION_STATE_KEY);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export function saveStoredWorkstationState(state: Partial<StoredWorkstationState>): void {
  if (typeof window === 'undefined') return;
  const current = getStoredWorkstationState();
  const updated = { ...current, ...state };
  try {
    localStorage.setItem(WORKSTATION_STATE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save workstation state', e);
  }
}

// Drafts Box (草稿箱) Helpers
export function getStoredDrafts(): PromptDraft[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredDraft(draft: PromptDraft): PromptDraft[] {
  if (typeof window === 'undefined') return [];
  const current = getStoredDrafts();
  const updated = [draft, ...current.filter((d) => d.id !== draft.id)];
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save draft', e);
  }
  return updated;
}

export function deleteStoredDraft(id: string): PromptDraft[] {
  if (typeof window === 'undefined') return [];
  const current = getStoredDrafts();
  const updated = current.filter((d) => d.id !== id);
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete draft', e);
  }
  return updated;
}

// Custom Login Gate Background Image
export function getStoredLoginBg(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LOGIN_BG_KEY);
}

export function setStoredLoginBg(bgUrl: string | null): void {
  if (typeof window === 'undefined') return;
  if (bgUrl) {
    localStorage.setItem(LOGIN_BG_KEY, bgUrl);
  } else {
    localStorage.removeItem(LOGIN_BG_KEY);
  }
}

// Local User Account & Password Credentials
export interface StoredUserCreds {
  [username: string]: string; // username -> password
}

export function getStoredUserCreds(): StoredUserCreds {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(USER_CREDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveUserCreds(username: string, password: string): void {
  if (typeof window === 'undefined') return;
  const creds = getStoredUserCreds();
  creds[username.trim()] = password.trim();
  try {
    localStorage.setItem(USER_CREDS_KEY, JSON.stringify(creds));
  } catch (e) {
    console.error('Failed to save user credentials', e);
  }
}

export function updateStoredUserAccount(oldUser: string, newUser: string, newPassword: string): void {
  if (typeof window === 'undefined') return;
  const creds = getStoredUserCreds();
  delete creds[oldUser.trim()];
  creds[newUser.trim()] = newPassword.trim();
  try {
    localStorage.setItem(USER_CREDS_KEY, JSON.stringify(creds));
    localStorage.setItem(AUTH_USER_KEY, newUser.trim());
  } catch (e) {
    console.error('Failed to update account', e);
  }
}

// Auth state in LocalStorage
export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredAuthToken(token: string | null, username?: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    if (username) localStorage.setItem(AUTH_USER_KEY, username);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

export function getStoredUsername(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_USER_KEY);
}

// Favorite models
export function getFavoriteModels(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITE_MODELS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteModel(modelId: string): string[] {
  const current = getFavoriteModels();
  let updated: string[];
  if (current.includes(modelId)) {
    updated = current.filter((id) => id !== modelId);
  } else {
    updated = [...current, modelId];
  }
  try {
    localStorage.setItem(FAVORITE_MODELS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save favorites', e);
  }
  return updated;
}

// IndexedDB implementation for Local History storage
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window is undefined'));
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveHistoryItem(item: GeneratedImage): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(item);
  } catch (e) {
    console.error('IndexedDB save failed', e);
  }

  try {
    fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }).catch(() => {});
  } catch {}
}

export async function getHistoryItems(): Promise<GeneratedImage[]> {
  let localItems: GeneratedImage[] = [];
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    localItems = await new Promise((resolve) => {
      request.onsuccess = () => {
        const result = (request.result || []) as GeneratedImage[];
        result.sort((a, b) => b.createdAt - a.createdAt);
        resolve(result);
      };
      request.onerror = () => resolve([]);
    });
  } catch {
    localItems = [];
  }

  try {
    const res = await fetch('/api/history');
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      const mergedMap = new Map<string, GeneratedImage>();

      data.data.forEach((item: GeneratedImage) => {
        mergedMap.set(item.id, item);
      });

      localItems.forEach((localItem) => {
        const remoteItem = mergedMap.get(localItem.id);
        if (
          !remoteItem ||
          !remoteItem.imageUrl ||
          remoteItem.imageUrl.includes('[IndexedDB_Local_Full_Res]') ||
          (localItem.imageUrl && localItem.imageUrl.startsWith('data:image/'))
        ) {
          mergedMap.set(localItem.id, localItem);
        }
      });

      const mergedList = Array.from(mergedMap.values());
      mergedList.sort((a, b) => b.createdAt - a.createdAt);
      return mergedList;
    }
  } catch {}

  return localItems;
}

export async function deleteHistoryItem(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
  } catch (e) {
    console.error('IndexedDB delete failed', e);
  }

  try {
    fetch(`/api/history?id=${id}`, { method: 'DELETE' }).catch(() => {});
  } catch {}
}

export async function clearAllHistory(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
  } catch (e) {
    console.error('IndexedDB clear failed', e);
  }

  try {
    fetch('/api/history', { method: 'DELETE' }).catch(() => {});
  } catch {}
}
