import { ComputeEngine, AIModel, UserSettings } from '@/types';

export const DEFAULT_SETTINGS: UserSettings = {
  computeEngine: 'pollinations',
  defaultModel: 'flux',
  defaultSampler: 'Euler a',
  defaultAspectRatio: '1:1',
  defaultBatchCount: 1,
  defaultSteps: 25,
  defaultGuidance: 8.0,
  defaultStyleStrength: 0.65,
  defaultLoraWeight: 0.5,
  defaultNegativePrompt: 'blurry, low quality, distorted, bad hands, bad face, deformed',
  darkMode: false,
  historyLimit: 50,
  enableD1Sync: false,
  autoEnhancePrompt: true,
};

export const SAMPLING_METHODS = [
  'Euler a',
  'DPM++ 2M Karras',
  'DPM++ SDE Karras',
  'DDIM',
  'LCM',
  'UniPC',
];

export const SCHEDULER_TYPES = [
  'Karras',
  'Exponential',
  'Normal',
  'SGM Uniform',
  'Simple',
];

export const ASPECT_RATIOS = [
  { label: '1:1 正方形', value: '1:1', icon: '⏹️', w: 1024, h: 1024 },
  { label: '16:9 横屏', value: '16:9', icon: '🖥️', w: 1280, h: 720 },
  { label: '9:16 手机屏', value: '9:16', icon: '📱', w: 720, h: 1280 },
  { label: '4:3 经典屏', value: '4:3', icon: '🖼️', w: 1024, h: 768 },
  { label: '3:4 竖屏', value: '3:4', icon: '📄', w: 768, h: 1024 },
];

export const COMPUTE_ENGINES: ComputeEngine[] = [
  {
    id: 'pollinations',
    name: 'Pollinations 免费全能算力池 (推荐首选)',
    type: 'pollinations',
    description: '免 API Key，支持 FLUX, SDXL, Turbo，秒级高质量生成',
    isDefault: true,
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow 硅基流动云算力',
    type: 'custom-api',
    endpoint: 'https://api.siliconflow.cn/v1/image/generations',
    description: '国内极速 FLUX.1 / SDXL 高清生成',
    isDefault: false,
  },
  {
    id: 'cloudflare-ai',
    name: 'Cloudflare Workers AI (边缘计算)',
    type: 'cloudflare-ai',
    description: '全球边缘节点低延迟推理',
    isDefault: false,
  },
  {
    id: 'openai',
    name: 'OpenAI DALL-E 3 官方引擎',
    type: 'dall-e',
    description: '顶级语言理解能力，画质高逼真',
    isDefault: false,
  },
  {
    id: 'stability',
    name: 'Stability AI 官方节点',
    type: 'stable-diffusion',
    description: 'SDXL 1.0 官方画质模型',
    isDefault: false,
  },
];

// Valid, highly reliable models mapped to supported provider keys
export const AI_MODELS: AIModel[] = [
  {
    id: 'flux',
    name: 'FLUX.1 极速旗舰版 (最高画质)',
    translatedName: 'FLUX.1 极速画质王者',
    description: 'Black Forest Labs 顶级画质大模型，出图逼真、细节震撼、语义精准',
    provider: 'pollinations',
    category: 'flux',
    isPopular: true,
    isFavorite: true,
    recommendedReason: '出图最稳定、画质最高、构图极佳',
  },
  {
    id: 'flux-realism',
    name: 'FLUX Realism 写实摄影版',
    translatedName: 'FLUX 写实摄影大模型',
    description: '专注于摄影级肖像、自然光影与超清晰肌理细节',
    provider: 'pollinations',
    category: 'realistic',
    isPopular: true,
  },
  {
    id: 'flux-anime',
    name: 'FLUX Anime 二次元大师版',
    translatedName: 'FLUX 动漫美学大模型',
    description: '极致细腻的二次元画风、水彩插画与唯美动漫构图',
    provider: 'pollinations',
    category: 'anime',
    isPopular: true,
  },
  {
    id: 'flux-3d',
    name: 'FLUX 3D CG 电影渲染版',
    translatedName: 'FLUX 3D CG 画质大模型',
    description: '媲美皮克斯与虚幻引擎 3D 渲染质感',
    provider: 'pollinations',
    category: '3d',
    isPopular: true,
  },
  {
    id: 'turbo',
    name: 'SDXL Turbo 闪电极速版',
    translatedName: 'SDXL Turbo 极速大模型',
    description: '秒级极速生成，适合快速创意探索',
    provider: 'pollinations',
    category: 'sdxl',
  },
  {
    id: '@cf/bytedance/stable-diffusion-xl-lightning',
    name: 'ByteDance Lightning (Cloudflare)',
    translatedName: '字节跳动 闪电大模型',
    description: 'Cloudflare 边缘极速 4-步推理模型',
    provider: 'cloudflare',
    category: 'sdxl',
    cfModelPath: '@cf/bytedance/stable-diffusion-xl-lightning',
  },
  {
    id: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    name: 'Cloudflare SDXL Base 1.0',
    translatedName: 'Cloudflare SDXL 原生模型',
    description: 'Cloudflare 官方边缘原生高清晰度模型',
    provider: 'cloudflare',
    category: 'sdxl',
    cfModelPath: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
  },
  {
    id: 'black-forest-labs/FLUX.1-schnell',
    name: 'SiliconFlow FLUX.1 Schnell',
    translatedName: '硅基流动 FLUX 极速版',
    description: 'SiliconFlow 节点托管高效率 FLUX 大模型',
    provider: 'custom',
    category: 'flux',
  },
  {
    id: 'dall-e-3',
    name: 'OpenAI DALL·E 3 高清官方引擎',
    translatedName: 'DALL·E 3 官方画质模型',
    description: 'OpenAI 官方语言理解与图像生成引擎',
    provider: 'openai',
    category: 'realistic',
  },
];

export const PRESET_MODELS = AI_MODELS;
