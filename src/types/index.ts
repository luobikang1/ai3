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

export interface PromptDraft {
  id: string;
  title: string;
  prompt: string;
  negativePrompt: string;
  modelId: string;
  stylePreset: string;
  loraId: string;
  styleStrength: number;
  loraWeight: number;
  steps: number;
  guidance: number;
  createdAt: number;
}

export interface GenerationParams {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  aspectRatio: string;
  model: string;
  sampler?: string;
  steps?: number;
  guidance?: number;
  strength?: number;
  styleStrength?: number;
  seed?: number;
  batchCount?: number;
  inputImage?: string;
  computeEngineId?: string;
  enhancePrompt?: boolean;
  stylePreset?: string;
  loraId?: string;
  loraWeight?: number;
}

export interface GeneratedImage {
  id: string;
  imageUrl: string;
  imageUrls?: string[];
  params: GenerationParams;
  createdAt: number;
  modelName: string;
  generationTimeMs?: number;
}

export interface UserAccount {
  username: string;
  passwordHash?: string;
  customBgImage?: string;
}

export interface UserSettings {
  computeEngine: string;
  sdApiEndpoint?: string;
  sdApiKey?: string;
  cfApiToken?: string;
  cfAccountId?: string;
  siliconApiKey?: string;
  openaiApiKey?: string;
  stabilityApiKey?: string;
  hfApiKey?: string;
  falApiKey?: string;
  customEndpoint?: string;
  customModels?: AIModel[];
  defaultModel: string;
  defaultSampler: string;
  defaultAspectRatio: string;
  defaultBatchCount: number;
  defaultSteps: number;
  defaultGuidance: number;
  defaultStyleStrength: number;
  defaultLoraWeight: number;
  defaultNegativePrompt: string;
  darkMode: boolean;
  historyLimit: number;
  enableD1Sync?: boolean;
  enableNsfw?: boolean;
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
