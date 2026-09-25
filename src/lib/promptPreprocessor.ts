// Robust Prompt Fidelity Preprocessor with custom translation dictionary & keyword protection
const ZH_EN_DICT: Record<string, string> = {
  白狐: 'white fox',
  白狐AI: 'white fox AI',
  赛博朋克: 'cyberpunk',
  霓虹: 'neon lights',
  机甲: 'mecha armor',
  二次元: 'anime key visual',
  动漫: 'anime masterpiece',
  水墨: 'ink wash painting',
  国风: 'traditional Chinese style',
  极清: 'ultra highly detailed, 8k resolution',
  写实: 'photorealistic, raw photo',
  胶片: '35mm film photograph',
  光影: 'cinematic lighting, dramatic shadows',
  肖像: 'masterpiece portrait',
  古风: 'ancient costume',
  高清: 'high definition, sharp focus',
};

export function parseAndWeightPrompt(prompt: string, styleStrength = 0.65): string {
  let clean = prompt.trim();
  if (!clean) return '';

  // 1. Quick Local Dictionary Translation for Common Chinese Image Terms
  Object.keys(ZH_EN_DICT).forEach((zhKey) => {
    if (clean.includes(zhKey)) {
      clean = clean.replaceAll(zhKey, ZH_EN_DICT[zhKey]);
    }
  });

  // 2. Weight boosting for prompt subject fidelity
  if (!clean.includes(':1.')) {
    const segments = clean.split(/[,，;；]/).filter(Boolean);
    if (segments.length > 0) {
      segments[0] = `(${segments[0].trim()}:1.35)`;
      if (segments.length > 1) {
        segments[1] = `(${segments[1].trim()}:1.2)`;
      }
      clean = segments.join(', ');
    }
  }

  // 3. Quality Boosters
  const baseBoosters = `(masterpiece:1.3), (best quality:1.3), highly detailed, sharp focus, 8k resolution, cinematic lighting`;
  return `${clean}, ${baseBoosters}`;
}

export function mergeNegativePrompts(userNegative?: string, defaultNegative?: string, nsfwEnabled = false): string {
  const custom = (userNegative || '').trim();
  const builtIn = (defaultNegative || 'blurry, low quality, distorted, extra limbs, bad hands, bad face, deformed, watermark').trim();

  const safetyFilter = nsfwEnabled ? '' : ', nsfw, explicit, nude, violence, gore';

  if (!custom) return `${builtIn}${safetyFilter}`;
  return `${custom}, ${builtIn}${safetyFilter}`;
}
