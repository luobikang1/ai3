export interface LoRAOption {
  id: string;
  name: string;
  triggerWord: string;
  category: 'style' | 'character' | 'detail' | 'lighting';
  description: string;
  previewColor: string;
}

export const LORA_PRESETS: LoRAOption[] = [
  {
    id: 'cyberpunk-neon',
    name: '赛博朋克 霓虹光泽 (Cyberpunk)',
    triggerWord: '<lora:cyberpunk_neon:0.8>, cyberpunk style, neon lights, futuristic city background, volumetric lighting',
    category: 'style',
    description: '增强科幻感、霓虹闪烁打光与未来金属质感',
    previewColor: 'from-purple-600 to-pink-600',
  },
  {
    id: 'realism-master',
    name: '超高清写真实化 (Realism Ultra)',
    triggerWord: '<lora:realism_master:0.85>, highly detailed skin texture, micro photography, 8k resolution, raw photo, realistic lighting',
    category: 'detail',
    description: '极大增加画面的细节清晰度、皮肤纹理与自然微距光影',
    previewColor: 'from-amber-600 to-orange-600',
  },
  {
    id: 'ghibli-anime',
    name: '吉卜力 清新二次元 (Ghibli Fantasy)',
    triggerWord: '<lora:ghibli_style:0.75>, ghibli style, studio ghibli, anime screencap, vibrant pastel colors, dreamy atmosphere',
    category: 'style',
    description: '清爽温和的水彩感与浪漫温暖的唯美动漫风',
    previewColor: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'chinese-ink',
    name: '国风写意水墨 (Chinese Ink Wash)',
    triggerWord: '<lora:chinese_ink:0.8>, traditional chinese ink wash painting, xieyi style, brush stroke texture, atmospheric mist, elegant',
    category: 'style',
    description: '浓淡相宜的水墨晕染与深远意境国风美术',
    previewColor: 'from-gray-700 to-black',
  },
  {
    id: 'blindbox-3d',
    name: '3D 盲盒立体潮玩 (3D Blindbox Toy)',
    triggerWord: '<lora:3d_blindbox:0.85>, 3d clay render, blindbox style, octan render, soft studio lighting, cute toy figure, pop mart style',
    category: 'character',
    description: '渲染出非常可爱的 3D 潮玩粘土与软萌模型立体感',
    previewColor: 'from-yellow-500 to-amber-500',
  },
  {
    id: 'cinematic-lighting',
    name: '电影级大师打光 (Cinematic Lighting)',
    triggerWord: '<lora:cinematic_light:0.8>, dramatic chiaroscuro, volumetric rays, cinematic golden hour lighting, lens flare, movie shot',
    category: 'lighting',
    description: '强烈的电影级光影明暗对比与极具氛围感的摄影构图',
    previewColor: 'from-blue-600 to-indigo-700',
  },
];
