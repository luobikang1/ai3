import { AIModel, ComputeEngine } from '@/types';

export const COMPUTE_ENGINES: ComputeEngine[] = [
  {
    id: 'stable-diffusion',
    name: 'Stable Diffusion (出厂标准引擎)',
    type: 'stable-diffusion',
    description: '标准 SD WebUI / AUTOMATIC1111 / ComfyUI / SDXL 本地或云端接口',
    isDefault: true,
  },
  {
    id: 'cloudflare-ai',
    name: 'Cloudflare Workers AI (Flux & 70+模型)',
    type: 'cloudflare-ai',
    description: 'Cloudflare 边缘极速神经网络推理，支持 Flux, SDXL, DreamShaper 等',
  },
  {
    id: 'huggingface',
    name: 'HuggingFace Inference API (开源无限制)',
    type: 'huggingface',
    description: '开源社区热门模型生态，支持黑盒及去限制开源模型极速推理',
  },
  {
    id: 'fal-ai',
    name: 'Fal.ai 高性能算力云',
    type: 'fal-ai',
    description: '秒级极速 Flux1.1 Pro、FLUX Schnell 与 SD3 超清推理节点',
  },
  {
    id: 'pollinations',
    name: 'Pollinations 免费开放算力池',
    type: 'pollinations',
    description: '无需 API Key 免费调用的全球 GPU 分布式图形生成算力',
  },
  {
    id: 'custom-api',
    name: '自定义 OpenAI / DALL-E / Wasmer API',
    type: 'custom-api',
    description: '支持 DALL-E 3、Google Imagen、OpenRouter 及 Wasmer WebAssembly 部署接口',
  },
];

export const DEFAULT_SETTINGS = {
  computeEngine: 'stable-diffusion',
  defaultModel: 'flux',
  defaultAspectRatio: '1:1',
  defaultBatchCount: 1,
  defaultSteps: 25,
  defaultGuidance: 7.5,
  darkMode: false,
  historyLimit: 50,
  enableD1Sync: true,
  autoEnhancePrompt: false,
};

export const ASPECT_RATIOS = [
  { label: '1:1 正方形', value: '1:1', width: 1024, height: 1024 },
  { label: '16:9 宽屏', value: '16:9', width: 1280, height: 720 },
  { label: '9:16 竖屏/手机', value: '9:16', width: 720, height: 1280 },
  { label: '4:3 传统横屏', value: '4:3', width: 1024, height: 768 },
  { label: '3:4 传统竖屏', value: '3:4', width: 768, height: 1024 },
];

export const PRESET_MODELS: AIModel[] = [
  // Flagship FLUX & SD Models
  {
    id: 'flux',
    name: 'FLUX.1 Schnell (推荐首选)',
    translatedName: 'FLUX.1 极速旗舰版 (推荐首选)',
    description: '最新一代顶级开源绘图模型，文字排版、审美打光与细节极佳',
    provider: 'pollinations',
    category: 'flux',
    isPopular: true,
    recommendedReason: '出图质感极强，支持复杂提示词与真实文字排版',
  },
  {
    id: 'sdxl-base-1.0',
    name: 'Stable Diffusion XL 1.0',
    translatedName: 'SDXL 1.0 官方旗舰',
    description: 'Stability AI 经典 SDXL 核心架构，构图大气，色彩丰富',
    provider: 'stable-diffusion',
    category: 'sdxl',
    isPopular: true,
    recommendedReason: '构图大气，通用性极高',
  },
  {
    id: 'black-forest-labs/FLUX.1-schnell',
    name: 'HuggingFace FLUX.1 Schnell',
    translatedName: 'HuggingFace 托管 FLUX.1',
    description: 'HuggingFace 官方 Inference 极速开源 Flux 节点',
    provider: 'huggingface',
    hfModelPath: 'black-forest-labs/FLUX.1-schnell',
    category: 'flux',
    isPopular: true,
    recommendedReason: '开源社区无限制高性能节点',
  },
  {
    id: '@cf/bytedance/stable-diffusion-xl-lightning',
    name: 'Cloudflare SDXL Lightning (字节跳动)',
    translatedName: 'CF 字节 SDXL 极速版',
    description: 'Cloudflare Workers AI 官方超高速 SDXL 生成引擎',
    provider: 'cloudflare',
    cfModelPath: '@cf/bytedance/stable-diffusion-xl-lightning',
    category: 'sdxl',
    isPopular: true,
  },
  {
    id: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    name: 'Cloudflare SDXL Base 1.0',
    translatedName: 'CF 托管 SDXL 1.0 基础版',
    description: 'Cloudflare Workers AI 官方稳定部署架构',
    provider: 'cloudflare',
    cfModelPath: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    category: 'sdxl',
  },
  {
    id: '@cf/lykon/dreamshaper-8-lcm',
    name: 'Cloudflare DreamShaper 8 LCM',
    translatedName: 'CF 梦境塑造者 8 极速版',
    description: '二次元动漫与艺术风格兼备，生成速度极快',
    provider: 'cloudflare',
    cfModelPath: '@cf/lykon/dreamshaper-8-lcm',
    category: 'anime',
    isPopular: true,
  },
  {
    id: 'flux-realism',
    name: 'FLUX Realism Ultra Photorealistic',
    translatedName: 'FLUX 逼真电影人像',
    description: '逼真写实摄影人像，皮肤微距与发丝打光质感',
    provider: 'pollinations',
    category: 'realistic',
    isPopular: true,
    recommendedReason: '人像写真与纪实大片必备',
  },
  {
    id: 'flux-anime',
    name: 'FLUX Anime Dream Master',
    translatedName: 'FLUX 日系动漫大师',
    description: '精美日系动漫立绘与二次元插画风格',
    provider: 'pollinations',
    category: 'anime',
    isPopular: true,
  },
  {
    id: 'flux-3d',
    name: 'FLUX 3D Blindbox Render',
    translatedName: 'FLUX 3D 盲盒立体手办',
    description: '立体 3D 盲盒公仔与三维模型渲染效果',
    provider: 'pollinations',
    category: '3d',
    isPopular: true,
  },
  {
    id: 'fal-ai/flux/schnell',
    name: 'Fal.ai FLUX Schnell Ultra',
    translatedName: 'Fal.ai 超高速 FLUX 节点',
    description: 'Fal.ai 极速推导节点，毫秒级响应',
    provider: 'fal-ai',
    falModelPath: 'fal-ai/flux/schnell',
    category: 'flux',
  },
  {
    id: 'dall-e-3',
    name: 'OpenAI DALL-E 3',
    translatedName: 'OpenAI DALL-E 3 顶尖商业模型',
    description: '语义理解极强，创意画面精准还原',
    provider: 'openai',
    category: 'sdxl',
    isPopular: true,
  },
  {
    id: 'runwayml/stable-diffusion-v1-5',
    name: 'HuggingFace SD v1.5',
    translatedName: 'HuggingFace SD 1.5 开源版',
    description: '开源社区经典 SD 1.5 绘图节点',
    provider: 'huggingface',
    hfModelPath: 'runwayml/stable-diffusion-v1-5',
    category: 'sd15',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon City V2',
    translatedName: '赛博朋克 霓虹未来城',
    description: '强烈的科幻霓虹与未来城市画风',
    provider: 'pollinations',
    category: 'sdxl',
  },
  {
    id: 'watercolor',
    name: 'Watercolor Hand-painted Art',
    translatedName: '浪漫手绘水彩画',
    description: '柔美优雅的手绘水彩与纸张质感',
    provider: 'pollinations',
    category: 'sd15',
  },
  {
    id: 'cinematic',
    name: 'Cinematic Master Shot',
    translatedName: '电影大片镜头滤镜',
    description: '高对比度、电影级光影与微距景深',
    provider: 'pollinations',
    category: 'realistic',
  },
  {
    id: 'ink-painting',
    name: 'Chinese Ink Wash Landscape',
    translatedName: '中国传统写意水墨',
    description: '国画水墨晕染与山水诗意',
    provider: 'pollinations',
    category: 'sdxl',
  },
  {
    id: 'ghibli-style',
    name: 'Studio Ghibli Anime Fantasy',
    translatedName: '吉卜力童话动漫',
    description: '温馨清新自然的日式动漫风格',
    provider: 'pollinations',
    category: 'anime',
    isPopular: true,
  },
  {
    id: 'chibi-3d',
    name: 'Cute Q Chibi Toy',
    translatedName: '萌系 Q 版盲盒公仔',
    description: '潮玩盲盒与卡通公仔效果',
    provider: 'pollinations',
    category: '3d',
  },
];

// Mainstream prompt enhancement master templates
export function enhancePromptText(rawPrompt: string): string {
  const clean = rawPrompt.trim();
  if (!clean) return clean;

  const qualityBoosters =
    ', masterpiece, best quality, highly detailed, sharp focus, 8k resolution, professional lighting, cinematic composition';

  if (clean.includes('masterpiece') || clean.includes('8k')) {
    return clean;
  }
  return clean + qualityBoosters;
}
