import Database from 'better-sqlite3';
import { config } from '../config.js';

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(config.databasePath);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    initTables(dbInstance);
  }
  return dbInstance;
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT CHECK(role IN ('user', 'assistant', 'system', 'tool')) NOT NULL,
      content TEXT NOT NULL,
      tool_calls TEXT,
      tool_results TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trend_reports (
      id TEXT PRIMARY KEY,
      niche TEXT NOT NULL,
      country TEXT NOT NULL,
      keyword TEXT NOT NULL,
      demand_score INTEGER NOT NULL,
      growth_rate REAL NOT NULL,
      competition_level TEXT CHECK(competition_level IN ('LOW', 'MEDIUM', 'HIGH')) NOT NULL,
      evidence_data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      niche TEXT NOT NULL,
      supplier_name TEXT NOT NULL,
      supplier_url TEXT,
      supplier_price_aud REAL NOT NULL,
      shipping_cost_aud REAL NOT NULL,
      recommended_retail_price_aud REAL NOT NULL,
      estimated_ad_cost_aud REAL NOT NULL,
      platform_fee_aud REAL NOT NULL,
      net_margin_aud REAL NOT NULL,
      margin_percentage REAL NOT NULL,
      status TEXT CHECK(status IN ('DISCOVERED', 'MARGIN_CALCULATED', 'DRAFT_CREATED', 'PUBLISHED')) DEFAULT 'DISCOVERED',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS draft_listings (
      id TEXT PRIMARY KEY,
      product_id TEXT REFERENCES products(id),
      store_platform TEXT NOT NULL,
      external_draft_id TEXT,
      meta_title TEXT NOT NULL,
      meta_description TEXT NOT NULL,
      slug TEXT NOT NULL,
      alt_text TEXT NOT NULL,
      tags TEXT NOT NULL,
      json_ld_schema TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      action_type TEXT CHECK(action_type IN ('CREATE_STORE_DRAFT', 'PUBLISH_LISTING', 'CREATE_AD_CAMPAIGN')) NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
      rejection_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS tool_logs (
      id TEXT PRIMARY KEY,
      conversation_id TEXT,
      tool_name TEXT NOT NULL,
      arguments TEXT NOT NULL,
      result TEXT NOT NULL,
      status TEXT CHECK(status IN ('SUCCESS', 'FAILED')) NOT NULL,
      execution_time_ms INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
