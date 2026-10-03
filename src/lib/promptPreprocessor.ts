// WhiteFox AI Three Structured Prompt Synthesis Kernel (Midjourney v6 / FLUX.1 / SDXL Standard)
const EXACT_PROMPT_DICT: Record<string, string> = {
  // Lighting & Optics Vocabulary (光影与光学词库)
  逆光: 'dramatic backlighting, glowing rim light, golden edge highlights',
  轮廓光: 'crisp rim light, sharp subtle edge lighting',
  柔光: 'soft diffuse studio lighting, gentle ambient glow, smooth shadows',
  丁达尔光: 'Tyndall effect, volumetric god rays piercing through mist',
  耶稣光: 'ethereal god rays, crepuscular light breaking through clouds',
  氛围光: 'cinematic atmospheric lighting, rich color contrast',
  自然光: 'natural sunlight, soft organic shadows, balanced exposure',
  侧光: 'dramatic side lighting, chiaroscuro light and shadow contrast',
  暖光: 'warm golden hour illumination, cozy color temperature',
  冷光: 'cool moody blue ambient lighting',
  霓虹: 'glowing neon lights, vibrant reflections, cybernetic atmosphere',
  光追: 'ray tracing, realistic optical reflections, subsurface scattering',
  光影: 'cinematic studio lighting, volumetric shadows, ray tracing reflections, golden hour glow',
  光线: 'dramatic lighting, rim light, golden hour glow',

  // Angle & Perspective Vocabulary (构图与视角词库)
  平视: 'eye level shot, balanced natural perspective',
  俯视: 'high angle shot, top-down perspective, bird\'s eye view',
  仰视: 'low angle shot, dramatic perspective, majestic presence',
  近景: 'close-up shot, sharp detailed focus',
  全景: 'panoramic wide angle view, breathtaking composition',
  特写: 'macro detail close-up, crystal clear focus',
  景深: 'bokeh depth of field, sharp focus on subject, beautifully blurred background',

  // Art Style & Media Vocabulary (画风与介质词库)
  厚涂: 'impasto oil painting style, textured brushstrokes, rich layered pigments, fine canvas texture',
  赛璐璐: 'anime cel shading style, crisp clean anime line art, vibrant flat colors, Makoto Shinkai key visual',
  莫奈: 'Claude Monet impressionism style, vibrant light reflections, painterly texture',
  毕加索: 'Picasso cubism style, abstract geometric shapes',
  极简: 'minimalist art design, clean elegant composition',
  哑光: 'matte finish, soft diffuse lighting',
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
  写实: 'photorealistic portrait, raw photo, DSLR shot, 85mm f/1.8 lens, natural skin texture',
  超写实: 'hyperrealistic masterpiece, highly detailed skin texture, professional studio camera photography',
  胶片: '35mm vintage film photograph, Kodak Portra 400, fine grain, nostalgic golden hour lighting',
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
  三维: '3d animated render, Unreal Engine 5, Octane render, subsurface scattering',
  Q版: 'chibi cute style, adorable character, rounded features',
  人像: 'professional portrait photography, natural skin texture, sharp clear eyes',
  壁纸: 'ultra-wide cinematic wallpaper, 8k resolution, stunning visual composition',
};

// Mainstream Categorized Quality & Lighting Boosters
const DOMAIN_QUALITY_BOOSTERS: Record<string, string> = {
  photo: 'raw photo, photorealistic, 8k resolution, 85mm f/1.8 lens, DSLR, natural skin texture, realistic studio lighting, sharp focus, volumetric shadows',
  anime: 'masterpiece anime visual, Makoto Shinkai aesthetic, vivid rich colors, crisp anime line art, cinematic lighting, 8k resolution',
  art: 'masterpiece digital painting, artistic composition, rich color balance, well-lit, optimal exposure, highly detailed, 8k resolution',
  cg3d: '3d render, Unreal Engine 5, Octane render, subsurface scattering, volumetric fog, raytraced reflections, well-lit, 8k resolution',
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

  // 2. Sanitize whitespace while preserving syntax like parentheses () and brackets [] for weighting
  clean = clean.replace(/\s+/g, ' ').replace(/,\s*,/g, ',').trim();

  const lower = clean.toLowerCase();

  // 3. Detect dominant art domain and inject domain-tailored quality boosters
  let domainBooster = DOMAIN_QUALITY_BOOSTERS.art;

  if (lower.includes('photo') || lower.includes('dslr') || lower.includes('portrait') || lower.includes('film') || lower.includes('realism') || lower.includes('photorealistic')) {
    domainBooster = DOMAIN_QUALITY_BOOSTERS.photo;
  } else if (lower.includes('anime') || lower.includes('cel shading') || lower.includes('manga') || lower.includes('ghibli') || lower.includes('animagine')) {
    domainBooster = DOMAIN_QUALITY_BOOSTERS.anime;
  } else if (lower.includes('3d') || lower.includes('pixar') || lower.includes('unreal engine') || lower.includes('octane') || lower.includes('cg')) {
    domainBooster = DOMAIN_QUALITY_BOOSTERS.cg3d;
  } else if (lower.includes('ink wash') || lower.includes('xuan paper') || lower.includes('chinese ink') || lower.includes('shanshui')) {
    domainBooster = DOMAIN_QUALITY_BOOSTERS.ink;
  }

  // Ensure prompt has foundational quality keywords without duplicating
  const hasQualityKeyword = lower.includes('photorealistic') || lower.includes('raw photo') || lower.includes('makoto shinkai') || lower.includes('unreal engine') || lower.includes('ink wash painting');
  if (!hasQualityKeyword) {
    if (!lower.includes('masterpiece') && !lower.includes('8k')) {
      clean = `${clean}, ${domainBooster}`;
    } else if (!lower.includes('well-lit') && !lower.includes('lighting') && !lower.includes('sharp focus')) {
      clean = `${clean}, well-lit, optimal exposure, sharp crystal clear focus`;
    }
  }

  return clean;
}

export function mergeNegativePrompts(userNegative?: string, defaultNegative?: string, nsfwEnabled = false): string {
  const custom = (userNegative || '').trim();

  if (nsfwEnabled) {
    return custom || 'worst quality, low quality, blurry, distorted, underexposed, bad anatomy, overexposed, bad hands, missing fingers';
  }

  const builtIn = (
    defaultNegative ||
    'worst quality, low quality, normal quality, blurry, distorted, jpeg artifacts, bad hands, bad face, deformed, extra fingers, mutated hands, poorly drawn face, poorly drawn hands, missing limbs, bad anatomy, watermark, text, signature, cropped, low resolution'
  ).trim();
  const safetyFilter = ', explicit violence, gore, explicit nudity, nsfw';

  if (!custom) return `${builtIn}${safetyFilter}`;
  return `${custom}, ${builtIn}${safetyFilter}`;
}
