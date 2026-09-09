export interface ComputeEngine {
  id: string;
  name: string;
  type: 'stable-diffusion' | 'cloudflare-ai' | 'huggingface' | 'fal-ai' | 'dall-e' | 'pollinations' | 'custom-api';
  endpoint?: string;
  apiKey?: string;
  description: string;
  isDefault?: boolean;
}

export interface AIModel {
  id: string;
  name: string;
  translatedName?: string;
  description: string;
  provider: 'stable-diffusion' | 'cloudflare' | 'huggingface' | 'fal-ai' | 'openai' | 'pollinations' | 'custom';
  cfModelPath?: string;
  hfModelPath?: string;
  falModelPath?: string;
  category: 'sdxl' | 'flux' | 'sd15' | 'anime' | 'realistic' | '3d';
  isFavorite?: boolean;
  isPopular?: boolean;
  isCustomAdded?: boolean;
  recommendedReason?: string;
}

export interface GenerationParams {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  aspectRatio: string; // '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  model: string;
  sampler?: string; // 'Euler a' | 'DPM++ 2M Karras' | 'DPM++ SDE Karras' | 'DDIM' | 'LCM' | 'UniPC'
  steps?: number;
  guidance?: number;
  strength?: number; // for img2img
  seed?: number;
  batchCount?: number; // 1, 2, 4
  inputImage?: string; // base64 or URL for img2img
  computeEngineId?: string;
  enhancePrompt?: boolean;
  stylePreset?: string;
}

export interface GeneratedImage {
  id: string;
  imageUrl: string; // single or primary URL
  imageUrls?: string[]; // for batch generation
  params: GenerationParams;
  createdAt: number;
  modelName: string;
}

export interface UserAccount {
  username: string;
  passwordHash?: string;
  customBgImage?: string;
}

export interface UserSettings {
  computeEngine: string; // 'stable-diffusion' | 'cloudflare-ai' | 'huggingface' | 'fal-ai' | 'pollinations' | 'custom'
  sdApiEndpoint?: string;
  sdApiKey?: string;
  cfApiToken?: string;
  cfAccountId?: string;
  hfApiKey?: string;
  falApiKey?: string;
  openaiApiKey?: string;
  customEndpoint?: string;
  customModels?: AIModel[];
  defaultModel: string;
  defaultSampler: string;
  defaultAspectRatio: string;
  defaultBatchCount: number;
  defaultSteps: number;
  defaultGuidance: number;
  darkMode: boolean;
  historyLimit: number;
  enableD1Sync?: boolean;
  autoEnhancePrompt?: boolean;
  loginBgImage?: string;
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
