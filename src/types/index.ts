export interface AIModel {
  id: string;
  name: string;
  translatedName?: string;
  description: string;
  provider: 'cloudflare' | 'pollinations' | 'custom';
  cfModelPath?: string;
  category: 'sdxl' | 'flux' | 'sd15' | 'anime' | 'realistic' | '3d';
  isFavorite?: boolean;
  isPopular?: boolean;
}

export interface GenerationParams {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  aspectRatio: string; // '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  model: string;
  steps?: number;
  guidance?: number;
  strength?: number; // for img2img
  seed?: number;
  inputImage?: string; // base64 or URL for img2img
}

export interface GeneratedImage {
  id: string;
  imageUrl: string;
  params: GenerationParams;
  createdAt: number;
  modelName: string;
}

export interface UserSettings {
  cfApiToken?: string;
  cfAccountId?: string;
  customEndpoint?: string;
  defaultModel: string;
  defaultAspectRatio: string;
  defaultSteps: number;
  defaultGuidance: number;
  darkMode: boolean;
  historyLimit: number;
}

export interface AuthState {
  isLoggedIn: boolean;
  username: string | null;
  token: string | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
