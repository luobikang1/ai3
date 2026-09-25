export interface StylePreset {
  id: string;
  name: string;
  icon: string;
  promptBoost: string;
  negativeBoost?: string;
  category: 'natural' | 'anime' | 'art' | '3d' | 'traditional';
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'none',
    name: '无滤镜 (原汁原味)',
    icon: '✨',
    promptBoost: '',
    category: 'natural',
  },
  {
    id: 'cyberpunk',
    name: '赛博朋克',
    icon: '🌃',
    promptBoost: 'cyberpunk style, neon lights, futuristic city background, glowing circuit patterns, chromatic aberration, vibrant cyan and purple lighting',
    negativeBoost: 'vintage, natural, pastel',
    category: 'art',
  },
  {
    id: 'photorealistic',
    name: '写实摄影',
    icon: '📷',
    promptBoost: 'photorealistic, 8k resolution, raw photo, DSLR shot, 85mm lens, f/1.8 aperture, natural lighting, sharp focus, skin texture, professional color grading',
    negativeBoost: 'cartoon, drawing, anime, illustration, painted, 3d render',
    category: 'natural',
  },
  {
    id: 'anime_v2',
    name: '动漫二次元',
    icon: '🎨',
    promptBoost: 'anime key visual, masterpiece, Makoto Shinkai style, vibrant colors, beautiful detailed line art, cinematic lighting, anime aesthetic',
    negativeBoost: 'photorealistic, realism, 3d render',
    category: 'anime',
  },
  {
    id: 'ink_wash',
    name: '国风水墨写意',
    icon: '🖌️',
    promptBoost: 'traditional Chinese ink wash painting, xuan paper texture, elegant brushstrokes, misty mountains, splash ink effect, poetic atmosphere',
    negativeBoost: 'western painting, 3d, neon, plastic',
    category: 'traditional',
  },
  {
    id: 'ukiyo_e',
    name: '浮世绘木刻',
    icon: '🌊',
    promptBoost: 'classic Japanese ukiyo-e woodblock print, Hokusai style, crisp outlines, flat graphic colors, traditional wave textures',
    negativeBoost: 'photorealistic, modern 3d, gradient background',
    category: 'traditional',
  },
  {
    id: 'watercolor_dream',
    name: '梦幻柔美水彩',
    icon: '💧',
    promptBoost: 'delicate watercolor painting, soft pastel color palette, fluid paint bleeds, artistic paper grain, whimsical romantic atmosphere',
    negativeBoost: 'sharp photo, hard edges, neon',
    category: 'art',
  },
  {
    id: 'oil_master',
    name: '大师印象派油画',
    icon: '🖼️',
    promptBoost: 'impressionist oil painting, thick impasto brushstrokes, Monet style light reflections, rich canvas texture, classical masterpiece',
    negativeBoost: 'digital flat graphic, photo',
    category: 'art',
  },
  {
    id: 'vintage_film',
    name: '复古黑胶胶片',
    icon: '🎞️',
    promptBoost: '35mm vintage film photograph, Kodak Portra 400, warm light leaks, subtle film grain, nostalgic atmosphere, 1980s aesthetic',
    negativeBoost: 'oversaturated, digital render, clean 3d',
    category: 'natural',
  },
  {
    id: 'unreal_3d',
    name: '虚幻引擎 3D CG',
    icon: '🧊',
    promptBoost: 'Unreal Engine 5 render, ray tracing, Octane Render 3D model, volumetric fog, subsurface scattering, movie quality CG asset',
    negativeBoost: 'flat 2d, sketch, lineart',
    category: '3d',
  },
  {
    id: 'ghibli_magic',
    name: '吉卜力治愈风',
    icon: '🌿',
    promptBoost: 'Studio Ghibli style, Hayao Miyazaki aesthetic, lush hand-painted nature background, vibrant sunny colors, nostalgic anime scene',
    negativeBoost: 'dark gothic, photorealistic, gloomy',
    category: 'anime',
  },
  {
    id: 'pixel_retro',
    name: '像素点阵复古',
    icon: '👾',
    promptBoost: 'pixel art style, 16-bit retro video game scene, detailed pixelated sprite, crisp grid alignment, nostalgic arcade aesthetic',
    negativeBoost: 'smooth gradients, photo',
    category: 'art',
  },
];
