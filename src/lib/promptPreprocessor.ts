// Clean, Ultra-High Fidelity Prompt Preprocessor for Free & Cloud Engines
const QUALITY_TRANSLATION_DICT: Record<string, string> = {
  白狐: 'a majestic white fox with glowing blue eyes and ethereal fur',
  白狐AI: 'white fox, glowing mystical blue eyes',
  赛博朋克: 'cyberpunk style, vibrant neon glowing lights, futuristic cityscape background',
  机甲: 'highly detailed mecha armor, polished metallic surfaces, intricate mechanical parts',
  二次元: 'masterpiece anime key visual, Makoto Shinkai aesthetic, crisp clean line art',
  动漫: 'beautiful anime illustration, vivid rich colors, cinematic composition',
  水墨: 'traditional Chinese ink wash painting, xuan paper texture, elegant poetic brushstrokes',
  国风: 'traditional Chinese style, oriental aesthetic, exquisite hanfu',
  写实: 'photorealistic portrait, raw photo, DSLR shot, 85mm lens, f/1.8 aperture, natural skin texture',
  胶片: '35mm vintage film photograph, Kodak Portra 400, fine grain, nostalgic lighting',
  光影: 'cinematic studio lighting, volumetric shadows, ray tracing reflections',
  肖像: 'masterpiece detailed portrait, crystal clear focus on eyes',
  古风: 'ancient oriental hanfu, elegant flowing silk fabric',
  高清: '8k resolution, hyperdetailed, sharp focus',
};

export function parseAndWeightPrompt(prompt: string, styleStrength = 0.65): string {
  let clean = prompt.trim();
  if (!clean) return '';

  // 1. Direct translation of common Chinese prompt terms to descriptive English
  Object.keys(QUALITY_TRANSLATION_DICT).forEach((key) => {
    if (clean.includes(key)) {
      clean = clean.replaceAll(key, QUALITY_TRANSLATION_DICT[key]);
    }
  });

  // Remove potential double parentheses or syntax corruptions that degrade FLUX/SDXL free engine rendering
  clean = clean.replace(/[\(\)\[\]]/g, '').trim();

  // 2. High-Fidelity Quality Boosters
  const qualityTriggers = 'masterpiece, best quality, highly detailed, 8k resolution, cinematic lighting, sharp focus, Octane render';

  return `${clean}, ${qualityTriggers}`;
}

export function mergeNegativePrompts(userNegative?: string, defaultNegative?: string, nsfwEnabled = false): string {
  const custom = (userNegative || '').trim();
  const builtIn = (defaultNegative || 'blurry, low quality, distorted, bad hands, bad face, deformed, watermark, low resolution').trim();

  const safetyFilter = nsfwEnabled ? '' : ', explicit violence, gore, explicit nudity';

  if (!custom) return `${builtIn}${safetyFilter}`;
  return `${custom}, ${builtIn}${safetyFilter}`;
}
