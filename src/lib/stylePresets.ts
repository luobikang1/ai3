export interface StylePreset {
  id: string;
  name: string;
  promptSuffix: string;
  negativePromptSuffix?: string;
  icon?: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'cyberpunk',
    name: '赛博朋克',
    promptSuffix: ', cyberpunk style, neon lights, futuristic night city, high tech, reflective surfaces, chromatic aberration, cinematic lighting, 8k resolution',
    negativePromptSuffix: ', natural, historical, rustic, blurry',
  },
  {
    id: 'realistic',
    name: '写实摄影',
    promptSuffix: ', ultra realistic, photorealistic, professional photography, 85mm lens, f/1.8, micro details, natural skin texture, studio lighting, highly detailed',
    negativePromptSuffix: ', anime, cartoon, drawing, illustration, 3d render',
  },
  {
    id: 'anime',
    name: '动漫二次元',
    promptSuffix: ', anime art style, vibrant colors, makoto shinkai aesthetic, detailed illustration, clean line art, masterwork, masterpiece',
    negativePromptSuffix: ', 3d render, photographic, realistic skin, grainy',
  },
  {
    id: 'concept-art',
    name: '概念艺术',
    promptSuffix: ', fantasy concept art, digital painting, epic composition, dramatic lighting, artstation trending, highly detailed, masterpiece',
    negativePromptSuffix: ', photo, snapshot, low quality',
  },
  {
    id: 'blindbox-3d',
    name: '3D 盲盒潮玩',
    promptSuffix: ', cute 3d blindbox toy, pop mart style, smooth plastic texture, isometric render, octane render, soft studio illumination, pastel colors',
    negativePromptSuffix: ', flat, 2d, rough texture',
  },
  {
    id: 'oil-painting',
    name: '古典油画',
    promptSuffix: ', classical oil painting style, rich impasto brushstrokes, renaissance atmosphere, chiaroscuro lighting, masterpiece canvas',
    negativePromptSuffix: ', digital vector, photo, anime',
  },
  {
    id: 'minimal-vector',
    name: '扁平矢量',
    promptSuffix: ', flat vector illustration, clean lines, minimalist geometry, modern UI design style, vibrant color palette',
    negativePromptSuffix: ', realistic photo, 3d, complex texture',
  },
];
