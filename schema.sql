-- Cloudflare D1 Database Schema for Baihu AI Three
CREATE TABLE IF NOT EXISTS history (
  id TEXT PRIMARY KEY,
  imageUrl TEXT NOT NULL,
  prompt TEXT NOT NULL,
  negativePrompt TEXT,
  width INTEGER,
  height INTEGER,
  aspectRatio TEXT,
  model TEXT,
  steps INTEGER,
  guidance INTEGER,
  modelName TEXT,
  createdAt INTEGER
);
