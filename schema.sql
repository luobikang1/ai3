-- Cloudflare D1 Database Schema for Baihu AI Three

-- History Table
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

-- Users Table for Optional Database User Auth
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);
