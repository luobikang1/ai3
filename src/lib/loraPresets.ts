export interface LoraPreset {
  id: string;
  name: string;
  icon: string;
  triggerWords: string;
  description: string;
}

export const LORA_PRESETS: LoraPreset[] = [
  {
    id: 'none',
    name: '无 LoRA 微调',
    icon: '⭕',
    triggerWords: '',
    description: '保持基础大模型纯正推演风格',
  },
  {
    id: 'detail_booster',
    name: '超级细节增强器',
    icon: '🔎',
    triggerWords: 'ultra detailed, intricate details, highly elaborate, micro precision',
    description: '提升毛发、衣物纹理及背景物体的极细微精致度',
  },
  {
    id: 'cinematic_lighting',
    name: '大师级电影光影',
    icon: '🎬',
    triggerWords: 'dramatic lighting, cinematic volumetric shadows, rim light, ambient occlusion',
    description: '增强画面明暗对比与立体通透光影氛围',
  },
  {
    id: 'glowing_neon',
    name: '发光霓虹特效',
    icon: '💡',
    triggerWords: 'bioluminescence, neon glow, glowing energy lines, vibrant luminescence',
    description: '赋予线条与关键构图柔和亮丽的高亮霓虹光泽',
  },
];
