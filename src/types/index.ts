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
  payload: string; // JSON string
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

export interface SystemStatus {
  status: string;
  environment: string;
  storePlatform: string;
  defaultNiche: string;
  defaultCountry: string;
  defaultCurrency: string;
  llm: {
    model: string;
    hasApiKey: boolean;
    mode: 'LIVE_CLAUDE' | 'SANDBOX_SIMULATOR';
  };
  stats: {
    pendingApprovalsCount: number;
    recentToolCallsCount: number;
  };
}

export interface ToolCallExecution {
  name: string;
  args: any;
  result: any;
}
