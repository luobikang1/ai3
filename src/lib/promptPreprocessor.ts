// Fidelity preprocessor: parses key subject words and applies weight boosters
export function parseAndWeightPrompt(prompt: string, styleStrength = 0.65): string {
  let clean = prompt.trim();
  if (!clean) return '';

  // If prompt is in Chinese or standard text, identify core subject keywords and boost weight
  // Adds subject weight (1.3) and style weight (1.2) automatically
  if (!clean.includes(':1.')) {
    const segments = clean.split(/[,，;；]/).filter(Boolean);
    if (segments.length > 0) {
      // First segment is considered primary subject
      segments[0] = `(${segments[0].trim()}:1.3)`;
      if (segments.length > 1) {
        // Second segment is considered primary style/scene
        segments[1] = `(${segments[1].trim()}:1.2)`;
      }
      clean = segments.join(', ');
    }
  }

  // Quality boosters with style strength adaptation
  const baseBoosters = `(masterpiece:1.3), (best quality:1.3), highly detailed, sharp focus, 8k resolution, cinematic lighting, photorealistic`;
  return `${clean}, ${baseBoosters}`;
}

export function mergeNegativePrompts(userNegative?: string, defaultNegative?: string): string {
  const custom = (userNegative || '').trim();
  const builtIn = (defaultNegative || 'blurry, low quality, distorted, extra limbs, bad hands, bad face, deformed, watermark').trim();

  if (!custom) return builtIn;
  return `${custom}, ${builtIn}`;
}
