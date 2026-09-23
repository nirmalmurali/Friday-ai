import { getDb } from './client.js';
import crypto from 'crypto';

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls?: string | null;
  tool_results?: string | null;
  created_at: string;
}

export interface Approval {
  id: string;
  action_type: 'CREATE_STORE_DRAFT' | 'PUBLISH_LISTING' | 'CREATE_AD_CAMPAIGN';
  title: string;
  description: string;
  payload: string; // JSON
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

export interface ToolLog {
  id: string;
  conversation_id?: string | null;
  tool_name: string;
  arguments: string;
  result: string;
  status: 'SUCCESS' | 'FAILED';
  execution_time_ms: number;
  created_at: string;
}

export const dbRepository = {
  // --- Conversations ---
  getConversations(): Conversation[] {
    const db = getDb();
    return db.prepare('SELECT * FROM conversations ORDER BY updated_at DESC').all() as Conversation[];
  },

  getConversationById(id: string): Conversation | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as Conversation | undefined;
  },

  createConversation(title: string): Conversation {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare('INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)').run(id, title, now, now);
    return { id, title, created_at: now, updated_at: now };
  },

  touchConversation(id: string) {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, id);
  },

  // --- Messages ---
  getMessages(conversationId: string): Message[] {
    const db = getDb();
    return db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(conversationId) as Message[];
  },

  addMessage(msg: {
    conversation_id: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    tool_calls?: any;
    tool_results?: any;
  }): Message {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const toolCallsJson = msg.tool_calls ? JSON.stringify(msg.tool_calls) : null;
    const toolResultsJson = msg.tool_results ? JSON.stringify(msg.tool_results) : null;

    db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content, tool_calls, tool_results, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, msg.conversation_id, msg.role, msg.content, toolCallsJson, toolResultsJson, now);

    dbRepository.touchConversation(msg.conversation_id);
    return {
      id,
      conversation_id: msg.conversation_id,
      role: msg.role,
      content: msg.content,
      tool_calls: toolCallsJson,
      tool_results: toolResultsJson,
      created_at: now,
    };
  },

  // --- Approvals Queue ---
  getApprovals(status?: 'PENDING' | 'APPROVED' | 'REJECTED'): Approval[] {
    const db = getDb();
    if (status) {
      return db.prepare('SELECT * FROM approvals WHERE status = ? ORDER BY created_at DESC').all(status) as Approval[];
    }
    return db.prepare('SELECT * FROM approvals ORDER BY created_at DESC').all() as Approval[];
  },

  getApprovalById(id: string): Approval | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM approvals WHERE id = ?').get(id) as Approval | undefined;
  },

  createApproval(item: {
    action_type: 'CREATE_STORE_DRAFT' | 'PUBLISH_LISTING' | 'CREATE_AD_CAMPAIGN';
    title: string;
    description: string;
    payload: any;
  }): Approval {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const payloadStr = typeof item.payload === 'string' ? item.payload : JSON.stringify(item.payload);

    db.prepare(`
      INSERT INTO approvals (id, action_type, title, description, payload, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'PENDING', ?)
    `).run(id, item.action_type, item.title, item.description, payloadStr, now);

    return {
      id,
      action_type: item.action_type,
      title: item.title,
      description: item.description,
      payload: payloadStr,
      status: 'PENDING',
      created_at: now,
    };
  },

  resolveApproval(id: string, status: 'APPROVED' | 'REJECTED', rejection_reason?: string): Approval | undefined {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE approvals
      SET status = ?, rejection_reason = ?, resolved_at = ?
      WHERE id = ?
    `).run(status, rejection_reason || null, now, id);

    return dbRepository.getApprovalById(id);
  },

  // --- Tool Audit Logs ---
  logToolExecution(log: {
    conversation_id?: string | null;
    tool_name: string;
    arguments: any;
    result: any;
    status: 'SUCCESS' | 'FAILED';
    execution_time_ms: number;
  }): ToolLog {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const argsJson = JSON.stringify(log.arguments);
    const resultJson = JSON.stringify(log.result);

    db.prepare(`
      INSERT INTO tool_logs (id, conversation_id, tool_name, arguments, result, status, execution_time_ms, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, log.conversation_id || null, log.tool_name, argsJson, resultJson, log.status, log.execution_time_ms, now);

    return {
      id,
      conversation_id: log.conversation_id || null,
      tool_name: log.tool_name,
      arguments: argsJson,
      result: resultJson,
      status: log.status,
      execution_time_ms: log.execution_time_ms,
      created_at: now,
    };
  },

  getToolLogs(limit = 50): ToolLog[] {
    const db = getDb();
    return db.prepare('SELECT * FROM tool_logs ORDER BY created_at DESC LIMIT ?').all(limit) as ToolLog[];
  },
};
