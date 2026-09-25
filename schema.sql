-- Schema for Cloudflare D1 Database (Optional Cloud Sync)

CREATE TABLE IF NOT EXISTS history (
    id TEXT PRIMARY KEY,
    image_url TEXT NOT NULL,
    prompt TEXT NOT NULL,
    negative_prompt TEXT,
    model_name TEXT NOT NULL,
    params_json TEXT NOT NULL,
    generation_time_ms INTEGER,
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_settings (
    username TEXT PRIMARY KEY,
    settings_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_favorites (
    username TEXT PRIMARY KEY,
    favorites_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);
