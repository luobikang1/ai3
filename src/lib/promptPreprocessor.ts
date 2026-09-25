// Comprehensive Prompt Preprocessor for Ultra-High Image Fidelity

const COMMON_ZH_EN_DICT: Record<string, string> = {
  白狐: 'white fox with glowing ethereal fur',
  白狐AI: 'mystical white fox',
  赛博朋克: 'cyberpunk style, glowing neon lights, futuristic cityscape',
  霓虹: 'vibrant neon glow, chromatic ambient lighting',
  机甲: 'detailed mecha armor, metallic reflections, intricate mechanical parts',
  二次元: 'anime key visual, Makoto Shinkai style, crisp anime line art',
  动漫: 'masterpiece anime illustration, vibrant vivid colors',
  水墨: 'traditional Chinese ink wash painting, xuan paper texture, elegant brushstrokes',
  国风: 'traditional Chinese aesthetics, oriental atmosphere',
  写实: 'photorealistic portrait, raw photo, DSLR shot, 85mm lens, f/1.8 aperture, natural skin texture',
  胶片: '35mm vintage film photograph, Kodak Portra 400, fine grain',
  光影: 'cinematic lighting, volumetric shadows, ray tracing reflections',
  肖像: 'masterpiece detailed portrait, sharp focus on eyes',
  古风: 'ancient oriental hanfu, floating silk fabric',
  高清: '8k resolution, hyperdetailed, sharp focus',
};

export function parseAndWeightPrompt(prompt: string, styleStrength = 0.65): string {
  let clean = prompt.trim();
  if (!clean) return '';

  // 1. Direct translation of common Chinese image terms
  Object.keys(COMMON_ZH_EN_DICT).forEach((zhKey) => {
    if (clean.includes(zhKey)) {
      clean = clean.replaceAll(zhKey, COMMON_ZH_EN_DICT[zhKey]);
    }
  });

  // 2. Weight boosting for core subject fidelity
  if (!clean.includes(':1.')) {
    const segments = clean.split(/[,，;；]/).filter(Boolean);
    if (segments.length > 0) {
      segments[0] = `(${segments[0].trim()}:1.4)`;
      if (segments.length > 1) {
        segments[1] = `(${segments[1].trim()}:1.25)`;
      }
      clean = segments.join(', ');
    }
  }

  // 3. Ultra Quality Triggers
  const qualityTriggers = `(masterpiece:1.4), (best quality:1.4), (ultra-detailed:1.3), 8k resolution, professional studio lighting, Octane render, photorealistic, cinematic composition`;
  return `${clean}, ${qualityTriggers}`;
}

export const NEGATIVE_PROMPT_PRESETS: Record<string, string> = {
  general: 'blurry, low quality, distorted, extra limbs, bad hands, bad face, deformed, watermark, low resolution, ugly, extra fingers, mutated hands',
  anime: 'photorealistic, 3d render, worst quality, low quality, bad anatomy, bad proportion, disfigured, deformed, blurry, extra limbs, extra fingers, text, watermark',
  realism: 'cartoon, anime, 3d render, drawing, illustration, plastic skin, fake reflections, bad lighting, low resolution, overexposed, underexposed, watermark, text',
  cg3d: '2d, flat drawing, sketch, anime, low poly, noisy, blurry, pixelated, bad textures, watermark',
};

export function mergeNegativePrompts(
  userNegative?: string,
  defaultNegative?: string,
  presetCategory = 'general',
  nsfwEnabled = false
): string {
  const custom = (userNegative || '').trim();
  const categoryNegative = NEGATIVE_PROMPT_PRESETS[presetCategory] || NEGATIVE_PROMPT_PRESETS.general;
  const base = (defaultNegative || categoryNegative).trim();

  const safetyFilter = nsfwEnabled ? '' : ', explicit violence, gore, explicit nudity';

  if (!custom) return `${base}${safetyFilter}`;
  return `${custom}, ${base}${safetyFilter}`;
}
