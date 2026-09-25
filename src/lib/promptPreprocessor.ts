// High-Fidelity Clean Prompt Preprocessor
const DICT_TRANSLATE: Record<string, string> = {
  白狐: 'a majestic white fox with glowing blue ethereal fur',
  白狐AI: 'white fox, glowing mystical eyes',
  赛博朋克: 'cyberpunk style, neon glowing lights, futuristic city',
  机甲: 'detailed mecha armor, metallic reflections',
  二次元: 'anime key visual, Makoto Shinkai style, vibrant colors',
  动漫: 'masterpiece anime illustration',
  水墨: 'traditional Chinese ink wash painting, elegant brushstrokes',
  国风: 'traditional Chinese style, oriental aesthetic',
  写实: 'photorealistic portrait, 8k resolution, raw photo',
  胶片: '35mm vintage film photograph, Kodak Portra 400',
  光影: 'cinematic lighting, volumetric shadows',
  肖像: 'detailed masterpiece portrait, sharp focus on eyes',
  古风: 'ancient oriental hanfu, elegant flowing silk',
  高清: '8k resolution, hyperdetailed, sharp focus',
};

export function parseAndWeightPrompt(prompt: string, styleStrength = 0.65): string {
  let clean = prompt.trim();
  if (!clean) return '';

  // 1. Translate Chinese keywords
  Object.keys(DICT_TRANSLATE).forEach((key) => {
    if (clean.includes(key)) {
      clean = clean.replaceAll(key, DICT_TRANSLATE[key]);
    }
  });

  // Remove potential double parentheses or broken weighting syntax that FLUX/Pollinations dislikes
  clean = clean.replace(/[\(\)]/g, '').trim();

  // Quality boosters
  const qualitySuffix = 'masterpiece, best quality, highly detailed, 8k resolution, cinematic lighting, sharp focus';

  return `${clean}, ${qualitySuffix}`;
}

export function mergeNegativePrompts(userNegative?: string, defaultNegative?: string, nsfwEnabled = false): string {
  const custom = (userNegative || '').trim();
  const builtIn = (defaultNegative || 'blurry, low quality, distorted, bad hands, bad face, deformed').trim();

  // If NSFW is disabled, add safety restrictions; if enabled, omit safety filter completely to allow full sensitive generation
  const safetyFilter = nsfwEnabled ? '' : ', explicit violence, gore, explicit nudity';

  if (!custom) return `${builtIn}${safetyFilter}`;
  return `${custom}, ${builtIn}${safetyFilter}`;
}
