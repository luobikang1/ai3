// WhiteFox AI Three Structured Prompt Synthesis Kernel (Midjourney v6 / FLUX.1 Standard)
const EXACT_PROMPT_DICT: Record<string, string> = {
  厚涂: 'impasto oil painting style, textured brushstrokes, rich layered pigments, fine canvas texture',
  赛璐璐: 'anime cel shading style, crisp clean anime line art, vibrant flat colors, Makoto Shinkai key visual',
  景深: 'bokeh depth of field, sharp focus on subject, beautifully blurred background',
  '8k': '8k resolution, hyperdetailed, sharp crystal clear focus',
  '8K': '8k resolution, hyperdetailed, sharp crystal clear focus',
  莫奈: 'Claude Monet impressionism style, vibrant light reflections, painterly texture',
  毕加索: 'Picasso cubism style, abstract geometric shapes',
  极简: 'minimalist art design, clean elegant composition',
  哑光: 'matte finish, soft diffuse studio lighting',
  水彩: 'delicate watercolor painting, soft fluid color washes, wet-on-wet technique, artistic ink bleeds',
  白狐: 'a majestic white fox with fluffy ethereal fur and glowing blue eyes',
  白狐AI: 'mystical white fox with glowing blue eyes, masterpiece digital painting',
  狐狸: 'a graceful fox with vibrant fur',
  赛博朋克: 'cyberpunk style, vibrant neon glowing lights, chromatic aberration, futuristic cityscape background',
  机甲: 'detailed mecha armor, polished metallic surfaces, intricate mechanical parts, LED glow',
  二次元: 'masterpiece anime key visual, Makoto Shinkai aesthetic, crisp clean line art, vivid rich colors',
  动漫: 'beautiful anime illustration, vivid rich colors, cinematic composition, flawless anime eyes',
  水墨: 'traditional Chinese ink wash painting, xuan paper texture, elegant poetic brushstrokes, splash ink accent',
  国风: 'traditional Chinese style, oriental aesthetic, exquisite hanfu silk robes',
  汉服: 'exquisite traditional Chinese hanfu silk robes with intricate embroidery',
  写实: 'photorealistic portrait, raw photo, DSLR shot, 85mm lens, f/1.8 aperture, natural skin texture',
  超写实: 'hyperrealistic masterpiece, highly detailed skin texture, professional studio camera photography',
  胶片: '35mm vintage film photograph, Kodak Portra 400, fine grain, nostalgic golden hour lighting',
  光影: 'cinematic studio lighting, volumetric shadows, ray tracing reflections, golden hour glow',
  肖像: 'masterpiece detailed portrait, crystal clear focus on eyes and face',
  古风: 'ancient oriental aesthetic, elegant flowing silk fabric, misty scenery',
  高清: '8k resolution, hyperdetailed, sharp focus',
  唯美: 'aesthetics art, delicate composition, masterpiece lighting',
  科幻: 'sci-fi futuristic scene, volumetric light, advanced technology',
  插画: 'detailed digital illustration, artistic rendering, masterpiece',
  雪景: 'snowy mountain landscape, falling snowflakes, winter atmosphere',
  星空: 'stunning starry night sky, milky way galaxy, glowing nebula',
  桃花: 'blooming pink peach blossoms, romantic petals falling in wind',
  建筑: 'grand architectural design, majestic buildings',
  近景: 'close-up shot, detailed focus',
  全景: 'panoramic wide angle view, breathtaking scenery',
  特写: 'macro detail close-up, sharp crisp focus',
  光线: 'dramatic lighting, rim light, golden hour glow',
  三维: '3d animated render, Unreal Engine 5, Octane render, subsurface scattering',
  Q版: 'chibi cute style, adorable character, rounded features',
};

// Mainstream Categorized Quality & Lighting Boosters
const DOMAIN_QUALITY_BOOSTERS: Record<string, string> = {
  photo: 'raw photo, photorealistic, 8k uhd, 85mm f/1.8 lens, DSLR, natural skin texture, realistic studio lighting, well-lit, optimal exposure, sharp focus, volumetric shadows, ray tracing, 8k resolution',
  anime: 'masterpiece anime visual, Makoto Shinkai aesthetic, vivid rich colors, crisp anime line art, flawless anime style, well-lit, cinematic lighting, 8k resolution',
  art: 'masterpiece digital painting, artistic composition, rich color balance, well-lit, optimal exposure, highly detailed artwork, 8k resolution',
  cg3d: '3d render, Unreal Engine 5, Octane render, 8k 3d asset, subsurface scattering, volumetric fog, path tracing, raytraced reflections, well-lit, 8k resolution',
  ink: 'traditional Chinese ink wash painting, xuan paper texture, elegant poetic brushstrokes, splash ink accent, artistic lighting',
};

export function parseAndWeightPrompt(prompt: string, styleStrength = 0.65): string {
  let clean = prompt.trim();
  if (!clean) return '';

  // 1. Direct keyword replacements for Chinese terms & art style vocabulary
  Object.keys(EXACT_PROMPT_DICT).forEach((key) => {
    if (clean.includes(key)) {
      clean = clean.replaceAll(key, EXACT_PROMPT_DICT[key]);
    }
  });

  // 2. Sanitize syntax (remove mismatched brackets/parentheses)
  clean = clean.replace(/[\(\)\[\]]/g, ' ').replace(/\s+/g, ' ').trim();

  const lower = clean.toLowerCase();

  // 3. Detect dominant art domain and inject domain-tailored quality boosters
  let domainBooster = DOMAIN_QUALITY_BOOSTERS.art;

  if (lower.includes('photo') || lower.includes('dslr') || lower.includes('portrait') || lower.includes('film') || lower.includes('realism')) {
    domainBooster = DOMAIN_QUALITY_BOOSTERS.photo;
  } else if (lower.includes('anime') || lower.includes('cel shading') || lower.includes('manga') || lower.includes('ghibli')) {
    domainBooster = DOMAIN_QUALITY_BOOSTERS.anime;
  } else if (lower.includes('3d') || lower.includes('pixar') || lower.includes('unreal engine') || lower.includes('octane')) {
    domainBooster = DOMAIN_QUALITY_BOOSTERS.cg3d;
  } else if (lower.includes('ink wash') || lower.includes('xuan paper') || lower.includes('chinese ink')) {
    domainBooster = DOMAIN_QUALITY_BOOSTERS.ink;
  }

  // Ensure prompt has foundational lighting and exposure quality keywords
  if (!lower.includes('masterpiece') && !lower.includes('photorealistic') && !lower.includes('8k')) {
    clean = `${clean}, ${domainBooster}`;
  } else if (!lower.includes('well-lit') && !lower.includes('exposure')) {
    clean = `${clean}, well-lit, optimal exposure, 8k resolution, highly detailed, sharp crystal clear focus`;
  }

  return clean;
}

export function mergeNegativePrompts(userNegative?: string, defaultNegative?: string, nsfwEnabled = false): string {
  const custom = (userNegative || '').trim();

  if (nsfwEnabled) {
    // When adult content generation is ON, keep negative prompt completely clean without censorship keywords
    return custom || 'blurry, low quality, distorted, dark shadows, underexposed, bad anatomy, overexposed, pitch black background';
  }

  const builtIn = (defaultNegative || 'blurry, low quality, distorted, dark shadows, underexposed, bad hands, bad face, deformed, extra fingers, mutated hands, poorly drawn face, poorly drawn hands, missing limbs, bad anatomy, watermark, text, low resolution, overexposed, pitch black background').trim();
  const safetyFilter = ', explicit violence, gore, explicit nudity, nsfw';

  if (!custom) return `${builtIn}${safetyFilter}`;
  return `${custom}, ${builtIn}${safetyFilter}`;
}
