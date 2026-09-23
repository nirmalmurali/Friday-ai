import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const dbPath = process.env.DATABASE_PATH || './data/friday.db';
const dbDir = path.dirname(path.resolve(dbPath));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
  defaultNiche: process.env.DEFAULT_NICHE || 'pet products',
  defaultCountry: process.env.DEFAULT_COUNTRY || 'Australia',
  defaultCurrency: process.env.DEFAULT_CURRENCY || 'AUD',
  storePlatform: process.env.STORE_PLATFORM || 'mock',
  databasePath: path.resolve(dbPath),
};
