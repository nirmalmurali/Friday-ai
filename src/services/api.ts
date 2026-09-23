import type { Approval, Conversation, Message, SystemStatus, ToolLog } from '../types';

const BASE_URL = '/api';

export const api = {
  // System Status
  async getSystemStatus(): Promise<SystemStatus> {
    const res = await fetch(`${BASE_URL}/system/status`);
    if (!res.ok) throw new Error('Failed to fetch system status');
    return res.json();
  },

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    const res = await fetch(`${BASE_URL}/conversations`);
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  },

  async createConversation(title?: string): Promise<Conversation> {
    const res = await fetch(`${BASE_URL}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title || 'New Strategy Session' }),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return res.json();
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const res = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`);
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  },

  async sendMessage(conversationId: string, content: string): Promise<{
    message: Message;
    toolCallsExecuted: any[];
    mode: 'live_claude' | 'sandbox_simulator';
  }> {
    const res = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown server error' }));
      throw new Error(err.error || 'Failed to send message');
    }
    return res.json();
  },

  // Approvals
  async getApprovals(status?: 'PENDING' | 'APPROVED' | 'REJECTED'): Promise<Approval[]> {
    const url = status ? `${BASE_URL}/approvals?status=${status}` : `${BASE_URL}/approvals`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch approvals');
    return res.json();
  },

  async resolveApproval(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    reason?: string
  ): Promise<{ approval: Approval; execution?: any }> {
    const res = await fetch(`${BASE_URL}/approvals/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to resolve approval' }));
      throw new Error(err.error || 'Failed to resolve approval');
    }
    return res.json();
  },

  // Tool Logs
  async getToolLogs(limit = 50): Promise<ToolLog[]> {
    const res = await fetch(`${BASE_URL}/system/tool-logs?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch tool logs');
    return res.json();
  },
};
